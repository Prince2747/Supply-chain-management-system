"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-logger";
import {
  notifyTransportCoordinator,
  notifyAllWarehouseManagers,
  createBulkNotifications,
} from "@/lib/notifications/unified-actions";
import { NotificationCategory, NotificationType } from "@/lib/generated/prisma";
import { redirect } from "next/navigation";

const DASHBOARD_LOCALES = ["en", "am"] as const;

const ISSUE_TYPES = [
  "VEHICLE_BREAKDOWN",
  "TRAFFIC_DELAY",
  "WEATHER_DELAY",
  "DAMAGED_GOODS",
  "ROUTE_CHANGE",
  "OTHER",
] as const;

function revalidateDashboardPath(pathWithoutLocale: string) {
  for (const locale of DASHBOARD_LOCALES) {
    revalidatePath(`/${locale}${pathWithoutLocale}`);
  }
}

// Get current driver profile
async function getCurrentDriver() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/login");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile || profile.role !== "transport_driver") {
    redirect("/unauthorized");
  }

  // Find the driver record associated with this profile
  const driver = await prisma.driver.findFirst({
    where: { email: user.email }
  });

  if (!driver) {
    redirect("/unauthorized");
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

  const rawInput = (qrCode || "").trim();
  let scannedBatchCode: string | undefined;
  let scannedQrCode: string | undefined;
  if (rawInput) {
    try {
      const parsed = JSON.parse(rawInput);
      if (parsed && typeof parsed === "object") {
        if (typeof (parsed as any).batchCode === "string") scannedBatchCode = (parsed as any).batchCode.trim();
        if (typeof (parsed as any).qrCode === "string") scannedQrCode = (parsed as any).qrCode.trim();
      }
    } catch {
      // not JSON; treat as raw code
    }
  }

  try {
    // Verify the task belongs to this driver
    const task = await prisma.transportTask.findFirst({
      where: {
        id: taskId,
        driverId: driver.id,
        status: "SCHEDULED"
      },
      select: {
        id: true,
        cropBatchId: true,
        notes: true,
        cropBatch: {
          select: {
            batchCode: true,
            qrCode: true,
            warehouseId: true,
            farm: {
              select: {
                name: true,
                location: true,
                region: true,
                zone: true,
                woreda: true,
                kebele: true,
              },
            },
            warehouse: {
              select: {
                name: true,
                code: true,
                address: true,
                city: true,
              },
            },
          }
        },
        coordinator: {
          select: {
            userId: true,
            name: true,
          }
        }
      }
    });

    if (!task) {
      return { success: false, error: "Task not found or not available for pickup" };
    }

    // Verify scanned value matches this crop batch.
    // Accept: raw batchCode, raw qrCode, or a JSON payload containing either.
    const matchesBatchCode = rawInput === task.cropBatch.batchCode || scannedBatchCode === task.cropBatch.batchCode;
    const matchesQrCode = !!task.cropBatch.qrCode && (rawInput === task.cropBatch.qrCode || scannedQrCode === task.cropBatch.qrCode);

    if (!matchesBatchCode && !matchesQrCode) {
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
      details: { batchCode: task.cropBatch.batchCode, qrCode: rawInput }
    });

    // Notify the assigned transport coordinator
    try {
      const farmLocation = task.cropBatch.farm
        ? [
            task.cropBatch.farm.location,
            task.cropBatch.farm.region,
            task.cropBatch.farm.zone,
            task.cropBatch.farm.woreda,
            task.cropBatch.farm.kebele,
          ]
            .filter(Boolean)
            .join(", ")
        : null;
      const warehouseLabel = task.cropBatch.warehouse
        ? `${task.cropBatch.warehouse.name} (${task.cropBatch.warehouse.code})`
        : null;
      const warehouseLocation = task.cropBatch.warehouse
        ? task.cropBatch.warehouse.address || task.cropBatch.warehouse.city || null
        : null;

      await notifyTransportCoordinator(
        task.coordinator.userId,
        NotificationType.PICKUP_READY,
        'Pickup confirmed',
        `Pickup confirmed: Driver ${driver.name} picked up batch ${task.cropBatch.batchCode}${farmLocation ? ` from ${farmLocation}` : ''}.`,
        {
          batchId: task.cropBatchId,
          batchCode: task.cropBatch.batchCode,
          driverId: driver.id,
          farmLocation,
          warehouseId: task.cropBatch.warehouseId,
          warehouseName: task.cropBatch.warehouse?.name,
        }
      );

      const procurementOfficers = await prisma.profile.findMany({
        where: { role: 'procurement_officer', isActive: true },
        select: { userId: true },
      });

      if (procurementOfficers.length > 0) {
        await createBulkNotifications(
          procurementOfficers.map((po) => ({
            userId: po.userId,
            type: NotificationType.PICKUP_READY,
            category: NotificationCategory.TRANSPORT,
            title: 'Pickup confirmed',
            message: `Batch ${task.cropBatch.batchCode} picked up${farmLocation ? ` from ${farmLocation}` : ''}. Destination: ${warehouseLabel || 'assigned warehouse'}.`,
            metadata: {
              batchId: task.cropBatchId,
              batchCode: task.cropBatch.batchCode,
              farmLocation,
              warehouseId: task.cropBatch.warehouseId,
              warehouseName: task.cropBatch.warehouse?.name,
              warehouseLocation,
            },
          }))
        );
      }

      if (task.cropBatch.warehouseId) {
        await notifyAllWarehouseManagers(
          task.cropBatch.warehouseId,
          NotificationType.SHIPMENT_ARRIVING,
          'Batch picked up',
          `Batch ${task.cropBatch.batchCode} has been picked up and is en route to ${warehouseLabel || 'your warehouse'}.`,
          {
            batchId: task.cropBatchId,
            batchCode: task.cropBatch.batchCode,
            farmLocation,
            warehouseLocation,
          }
        );
      }
    } catch (e) {
      console.warn('Failed to notify coordinator on pickup:', e);
    }

    revalidateDashboardPath("/dashboard/transport-driver");
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

  const rawInput = (qrCode || "").trim();
  let scannedBatchCode: string | undefined;
  let scannedQrCode: string | undefined;
  if (rawInput) {
    try {
      const parsed = JSON.parse(rawInput);
      if (parsed && typeof parsed === "object") {
        if (typeof (parsed as any).batchCode === "string") scannedBatchCode = (parsed as any).batchCode.trim();
        if (typeof (parsed as any).qrCode === "string") scannedQrCode = (parsed as any).qrCode.trim();
      }
    } catch {
      // not JSON; treat as raw code
    }
  }

  try {
    // Verify the task belongs to this driver
    const task = await prisma.transportTask.findFirst({
      where: {
        id: taskId,
        driverId: driver.id,
        status: "IN_TRANSIT"
      },
      select: {
        id: true,
        cropBatchId: true,
        notes: true,
        cropBatch: {
          select: {
            batchCode: true,
            qrCode: true,
            warehouseId: true,
          }
        },
        coordinator: {
          select: {
            userId: true,
            name: true,
          }
        }
      }
    });

    if (!task) {
      return { success: false, error: "Task not found or not available for delivery" };
    }

    // Verify scanned value matches this crop batch.
    // Accept: raw batchCode, raw qrCode, or a JSON payload containing either.
    const matchesBatchCode = rawInput === task.cropBatch.batchCode || scannedBatchCode === task.cropBatch.batchCode;
    const matchesQrCode = !!task.cropBatch.qrCode && (rawInput === task.cropBatch.qrCode || scannedQrCode === task.cropBatch.qrCode);

    if (!matchesBatchCode && !matchesQrCode) {
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
      details: { batchCode: task.cropBatch.batchCode, qrCode: rawInput }
    });

    // Notify coordinator + destination warehouse managers that warehouse receipt is pending.
    try {
      await notifyTransportCoordinator(
        task.coordinator.userId,
        NotificationType.DELIVERY_CONFIRMED,
        'Delivery confirmed',
        `Delivery confirmed: Driver ${driver.name} delivered batch ${task.cropBatch.batchCode}. Awaiting warehouse receipt confirmation.`,
        { batchId: task.cropBatchId, batchCode: task.cropBatch.batchCode, driverId: driver.id }
      );
    } catch (e) {
      console.warn('Failed to notify coordinator on delivery:', e);
    }

    if (task.cropBatch.warehouseId) {
      try {
        const warehouseManagers = await prisma.profile.findMany({
          where: {
            role: 'warehouse_manager',
            isActive: true,
            warehouseId: task.cropBatch.warehouseId,
          },
          select: { userId: true },
        });

        if (warehouseManagers.length > 0) {
          await notifyAllWarehouseManagers(
            task.cropBatch.warehouseId,
            NotificationType.BATCH_RECEIVED,
            'Batch delivered',
            `Batch delivered: Batch ${task.cropBatch.batchCode} has arrived. Please scan and confirm receipt.`,
            { batchId: task.cropBatchId, batchCode: task.cropBatch.batchCode }
          );
        }
      } catch (e) {
        console.warn('Failed to notify warehouse managers on delivery:', e);
      }
    }

    revalidateDashboardPath("/dashboard/transport-driver");
    return { success: true };
  } catch (error) {
    console.error("Error confirming delivery:", error);
    return { success: false, error: "Failed to confirm delivery" };
  }
}

// Report transport issue
export async function reportTransportIssue(formData: FormData) {
  const { profile, driver } = await getCurrentDriver();

  const transportTaskId = (formData.get("transportTaskId") as string)?.trim();
  const issueType = (formData.get("issueType") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!transportTaskId || !issueType || !description) {
    return { success: false, error: "All required fields must be filled" };
  }

  if (!ISSUE_TYPES.includes(issueType as any)) {
    return { success: false, error: "Invalid issue type" };
  }

  const data = {
    transportTaskId,
    issueType,
    description,
  };

  try {
    // Verify the task belongs to this driver
    const task = await prisma.transportTask.findFirst({
      where: {
        id: data.transportTaskId,
        driverId: driver.id
      },
      include: {
        coordinator: { select: { userId: true, name: true } },
        cropBatch: { select: { id: true, batchCode: true } },
      },
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
      details: { issueType: data.issueType, taskId: data.transportTaskId, role: profile.role }
    });

    if (task.coordinator?.userId) {
      try {
        await notifyTransportCoordinator(
          task.coordinator.userId,
          NotificationType.ISSUE_REPORTED,
          'Issue reported',
          `Issue reported for batch ${task.cropBatch?.batchCode || ''}: ${data.issueType}.`,
          { taskId: data.transportTaskId, issueId: issue.id, batchId: task.cropBatch?.id, batchCode: task.cropBatch?.batchCode }
        );
      } catch (e) {
        console.warn('Failed to notify coordinator on issue report:', e);
      }
    }

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
