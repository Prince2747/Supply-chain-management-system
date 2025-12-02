"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-logger";
import { redirect } from "next/navigation";

// Get current driver profile
async function getCurrentDriver() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile || profile.role !== "transport_driver") {
    throw new Error("Access denied: Transport driver role required");
  }

  // Find the driver record associated with this profile
  const driver = await prisma.driver.findFirst({
    where: { email: user.email }
  });

  if (!driver) {
    throw new Error("Driver record not found");
  }

  return { profile, driver };
}

// Get driver dashboard stats
export async function getDriverStats() {
  const { driver } = await getCurrentDriver();

  const [
    totalTasks,
    scheduledTasks,
    inTransitTasks,
    completedTasks,
    openIssues
  ] = await Promise.all([
    prisma.transportTask.count({ where: { driverId: driver.id } }),
    prisma.transportTask.count({ 
      where: { 
        driverId: driver.id, 
        status: "SCHEDULED" 
      } 
    }),
    prisma.transportTask.count({ 
      where: { 
        driverId: driver.id, 
        status: "IN_TRANSIT" 
      } 
    }),
    prisma.transportTask.count({ 
      where: { 
        driverId: driver.id, 
        status: "DELIVERED" 
      } 
    }),
    prisma.transportIssue.count({
      where: {
        transportTask: {
          driverId: driver.id
        },
        status: { in: ["OPEN", "IN_PROGRESS"] }
      }
    })
  ]);

  return {
    totalTasks,
    scheduledTasks,
    inTransitTasks,
    completedTasks,
    openIssues,
    driverInfo: {
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      status: driver.status
    }
  };
}

// Get assigned transport tasks for the driver
export async function getAssignedTasks() {
  const { driver } = await getCurrentDriver();

  return prisma.transportTask.findMany({
    where: { 
      driverId: driver.id,
      status: { in: ["SCHEDULED", "IN_TRANSIT"] }
    },
    include: {
      cropBatch: {
        include: {
          farm: true
        }
      },
      vehicle: true,
      coordinator: true,
      issues: true
    },
    orderBy: { scheduledDate: "asc" }
  });
}

// Get all tasks for the driver (including completed)
export async function getAllDriverTasks() {
  const { driver } = await getCurrentDriver();

  return prisma.transportTask.findMany({
    where: { driverId: driver.id },
    include: {
      cropBatch: {
        include: {
          farm: true
        }
      },
      vehicle: true,
      coordinator: true,
      issues: true
    },
    orderBy: { createdAt: "desc" }
  });
}

// Confirm batch pickup with QR code
export async function confirmPickup(taskId: string, formData: FormData) {
  const { profile, driver } = await getCurrentDriver();

  const qrCode = formData.get("qrCode") as string;
  const notes = formData.get("notes") as string || null;

  try {
    // Verify the task belongs to this driver
    const task = await prisma.transportTask.findFirst({
      where: {
        id: taskId,
        driverId: driver.id,
        status: "SCHEDULED"
      },
      include: {
        cropBatch: true
      }
    });

    if (!task) {
      return { success: false, error: "Task not found or not available for pickup" };
    }

    // Verify QR code matches the batch code
    if (qrCode !== task.cropBatch.batchCode) {
      return { success: false, error: "QR code does not match the assigned batch" };
    }

    // Update task status and pickup date
    await prisma.transportTask.update({
      where: { id: taskId },
      data: {
        status: "IN_TRANSIT",
        actualPickupDate: new Date(),
        notes: notes ? `${task.notes || ""}\nPickup confirmed: ${notes}`.trim() : task.notes
      }
    });

    // Update driver status
    await prisma.driver.update({
      where: { id: driver.id },
      data: { status: "ON_DUTY" }
    });

    await logActivity({
      userId: profile.userId,
      action: "CONFIRM_PICKUP",
      entityType: "TransportTask",
      entityId: taskId,
      details: { batchCode: task.cropBatch.batchCode, qrCode }
    });

    revalidatePath("/dashboard/transport-driver");
    return { success: true };
  } catch (error) {
    console.error("Error confirming pickup:", error);
    return { success: false, error: "Failed to confirm pickup" };
  }
}

// Confirm delivery with QR code
export async function confirmDelivery(taskId: string, formData: FormData) {
  const { profile, driver } = await getCurrentDriver();

  const qrCode = formData.get("qrCode") as string;
  const notes = formData.get("notes") as string || null;

  try {
    // Verify the task belongs to this driver
    const task = await prisma.transportTask.findFirst({
      where: {
        id: taskId,
        driverId: driver.id,
        status: "IN_TRANSIT"
      },
      include: {
        cropBatch: true
      }
    });

    if (!task) {
      return { success: false, error: "Task not found or not available for delivery" };
    }

    // Verify QR code matches the batch code
    if (qrCode !== task.cropBatch.batchCode) {
      return { success: false, error: "QR code does not match the assigned batch" };
    }

    // Update task status and delivery date
    await prisma.transportTask.update({
      where: { id: taskId },
      data: {
        status: "DELIVERED",
        actualDeliveryDate: new Date(),
        notes: notes ? `${task.notes || ""}\nDelivery confirmed: ${notes}`.trim() : task.notes
      }
    });

    // Check if driver has any other active tasks
    const remainingTasks = await prisma.transportTask.count({
      where: {
        driverId: driver.id,
        status: { in: ["SCHEDULED", "IN_TRANSIT"] }
      }
    });

    // Update driver status if no more active tasks
    if (remainingTasks === 0) {
      await prisma.driver.update({
        where: { id: driver.id },
        data: { status: "AVAILABLE" }
      });
    }

    await logActivity({
      userId: profile.userId,
      action: "CONFIRM_DELIVERY",
      entityType: "TransportTask",
      entityId: taskId,
      details: { batchCode: task.cropBatch.batchCode, qrCode }
    });

    revalidatePath("/dashboard/transport-driver");
    return { success: true };
  } catch (error) {
    console.error("Error confirming delivery:", error);
    return { success: false, error: "Failed to confirm delivery" };
  }
}

// Report transport issue
export async function reportTransportIssue(formData: FormData) {
  const { profile, driver } = await getCurrentDriver();

  const data = {
    transportTaskId: formData.get("transportTaskId") as string,
    issueType: formData.get("issueType") as string,
    description: formData.get("description") as string,
  };

  try {
    // Verify the task belongs to this driver
    const task = await prisma.transportTask.findFirst({
      where: {
        id: data.transportTaskId,
        driverId: driver.id
      }
    });

    if (!task) {
      return { success: false, error: "Task not found or not assigned to you" };
    }

    const issue = await prisma.transportIssue.create({
      data: {
        transportTaskId: data.transportTaskId,
        issueType: data.issueType as any,
        description: data.description
      },
      include: {
        transportTask: {
          include: {
            cropBatch: true,
            vehicle: true
          }
        }
      }
    });

    // If it's a vehicle breakdown, update task status to delayed
    if (data.issueType === "VEHICLE_BREAKDOWN") {
      await prisma.transportTask.update({
        where: { id: data.transportTaskId },
        data: { status: "DELAYED" }
      });
    }

    await logActivity({
      userId: profile.userId,
      action: "REPORT_TRANSPORT_ISSUE",
      entityType: "TransportIssue",
      entityId: issue.id,
      details: { issueType: data.issueType, taskId: data.transportTaskId }
    });

    revalidatePath("/dashboard/transport-driver");
    return { success: true, issue };
  } catch (error) {
    console.error("Error reporting transport issue:", error);
    return { success: false, error: "Failed to report transport issue" };
  }
}

// Get transport issues reported by the driver
export async function getDriverIssues() {
  const { driver } = await getCurrentDriver();

  return prisma.transportIssue.findMany({
    where: {
      transportTask: {
        driverId: driver.id
      }
    },
    include: {
      transportTask: {
        include: {
          cropBatch: true,
          vehicle: true
        }
      }
    },
    orderBy: { reportedAt: "desc" }
  });
}
