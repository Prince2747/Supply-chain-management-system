"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-logger";

// Get current user profile
async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile || profile.role !== "transport_coordinator") {
    throw new Error("Access denied: Transport coordinator role required");
  }

  return profile;
}

// Dashboard Stats
export async function getTransportStats() {
  const profile = await getCurrentUser();

  const [
    totalTasks,
    scheduledTasks,
    inTransitTasks,
    completedTasks,
    totalVehicles,
    availableVehicles,
    totalDrivers,
    availableDrivers,
    openIssues
  ] = await Promise.all([
    prisma.transportTask.count(),
    prisma.transportTask.count({ where: { status: "SCHEDULED" } }),
    prisma.transportTask.count({ where: { status: "IN_TRANSIT" } }),
    prisma.transportTask.count({ where: { status: "DELIVERED" } }),
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: "AVAILABLE" } }),
    prisma.driver.count(),
    prisma.driver.count({ where: { status: "AVAILABLE" } }),
    prisma.transportIssue.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } })
  ]);

  return {
    totalTasks,
    scheduledTasks,
    inTransitTasks,
    completedTasks,
    totalVehicles,
    availableVehicles,
    totalDrivers,
    availableDrivers,
    openIssues
  };
}

// Transport Tasks
export async function getTransportTasks() {
  await getCurrentUser();

  return prisma.transportTask.findMany({
    include: {
      cropBatch: {
        include: {
          farm: true
        }
      },
      vehicle: true,
      driver: true,
      coordinator: true,
      issues: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createTransportTask(formData: FormData) {
  const profile = await getCurrentUser();

  const data = {
    cropBatchId: formData.get("cropBatchId") as string,
    vehicleId: formData.get("vehicleId") as string,
    driverId: formData.get("driverId") as string,
    pickupLocation: formData.get("pickupLocation") as string,
    deliveryLocation: formData.get("deliveryLocation") as string,
    scheduledDate: new Date(formData.get("scheduledDate") as string),
    notes: formData.get("notes") as string || null,
  };

  try {
    const task = await prisma.transportTask.create({
      data: {
        ...data,
        coordinatorId: profile.id,
      },
      include: {
        cropBatch: true,
        vehicle: true,
        driver: true
      }
    });

    await logActivity({
      userId: profile.userId,
      action: "CREATE_TRANSPORT_TASK",
      entityType: "TransportTask",
      entityId: task.id,
      details: {
        cropBatchId: data.cropBatchId,
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        scheduledDate: data.scheduledDate
      }
    });

    revalidatePath("/dashboard/transport-coordinator/tasks");
    return { success: true, task };
  } catch (error) {
    console.error("Error creating transport task:", error);
    return { success: false, error: "Failed to create transport task" };
  }
}

export async function updateTransportTask(taskId: string, formData: FormData) {
  const profile = await getCurrentUser();

  const status = formData.get("status") as string;
  const data = {
    status: status as any, // Type assertion to handle enum
    actualPickupDate: formData.get("actualPickupDate") ? new Date(formData.get("actualPickupDate") as string) : null,
    actualDeliveryDate: formData.get("actualDeliveryDate") ? new Date(formData.get("actualDeliveryDate") as string) : null,
    notes: formData.get("notes") as string || null,
  };

  try {
    const task = await prisma.transportTask.update({
      where: { id: taskId },
      data,
      include: {
        cropBatch: true,
        vehicle: true,
        driver: true
      }
    });

    await logActivity({
      userId: profile.userId,
      action: "UPDATE_TRANSPORT_TASK",
      entityType: "TransportTask",
      entityId: task.id,
      details: { status: data.status, updatedFields: Object.keys(data) }
    });

    revalidatePath("/dashboard/transport-coordinator/tasks");
    return { success: true, task };
  } catch (error) {
    console.error("Error updating transport task:", error);
    return { success: false, error: "Failed to update transport task" };
  }
}

// Vehicles
export async function getVehicles() {
  await getCurrentUser();

  return prisma.vehicle.findMany({
    include: {
      transportTasks: {
        where: { status: { in: ["SCHEDULED", "IN_TRANSIT"] } },
        include: {
          cropBatch: true
        }
      }
    },
    orderBy: { plateNumber: "asc" }
  });
}

export async function createVehicle(formData: FormData) {
  const profile = await getCurrentUser();

  const vehicleType = formData.get("type") as string;
  const data = {
    plateNumber: formData.get("plateNumber") as string,
    type: vehicleType as any, // Type assertion to handle enum
    capacity: parseFloat(formData.get("capacity") as string),
  };

  try {
    const vehicle = await prisma.vehicle.create({
      data
    });

    await logActivity({
      userId: profile.userId,
      action: "CREATE_VEHICLE",
      entityType: "Vehicle",
      entityId: vehicle.id,
      details: { plateNumber: data.plateNumber, type: data.type, capacity: data.capacity }
    });

    revalidatePath("/dashboard/transport-coordinator/vehicles");
    return { success: true, vehicle };
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return { success: false, error: "Failed to create vehicle" };
  }
}

export async function updateVehicleStatus(vehicleId: string, status: string) {
  const profile = await getCurrentUser();

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: status as any } // Type assertion to handle enum
    });

    await logActivity({
      userId: profile.userId,
      action: "UPDATE_VEHICLE_STATUS",
      entityType: "Vehicle",
      entityId: vehicle.id,
      details: { status, plateNumber: vehicle.plateNumber }
    });

    revalidatePath("/dashboard/transport-coordinator/vehicles");
    return { success: true, vehicle };
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    return { success: false, error: "Failed to update vehicle status" };
  }
}

// Drivers
export async function getDrivers() {
  await getCurrentUser();

  return prisma.driver.findMany({
    include: {
      transportTasks: {
        where: { status: { in: ["SCHEDULED", "IN_TRANSIT"] } },
        include: {
          cropBatch: true,
          vehicle: true
        }
      }
    },
    orderBy: { name: "asc" }
  });
}

export async function createDriver(formData: FormData) {
  const profile = await getCurrentUser();

  const data = {
    name: formData.get("name") as string,
    licenseNumber: formData.get("licenseNumber") as string,
    phone: formData.get("phone") as string,
    email: formData.get("email") as string || null,
  };

  try {
    const driver = await prisma.driver.create({
      data
    });

    await logActivity({
      userId: profile.userId,
      action: "CREATE_DRIVER",
      entityType: "Driver",
      entityId: driver.id,
      details: { name: data.name, licenseNumber: data.licenseNumber }
    });

    revalidatePath("/dashboard/transport-coordinator/drivers");
    return { success: true, driver };
  } catch (error) {
    console.error("Error creating driver:", error);
    return { success: false, error: "Failed to create driver" };
  }
}

export async function updateDriverStatus(driverId: string, status: string) {
  const profile = await getCurrentUser();

  try {
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: { status: status as any } // Type assertion to handle enum
    });

    await logActivity({
      userId: profile.userId,
      action: "UPDATE_DRIVER_STATUS",
      entityType: "Driver",
      entityId: driver.id,
      details: { status, name: driver.name }
    });

    revalidatePath("/dashboard/transport-coordinator/drivers");
    return { success: true, driver };
  } catch (error) {
    console.error("Error updating driver status:", error);
    return { success: false, error: "Failed to update driver status" };
  }
}

// Issues
export async function getTransportIssues() {
  await getCurrentUser();

  return prisma.transportIssue.findMany({
    include: {
      transportTask: {
        include: {
          cropBatch: {
            include: {
              farm: true
            }
          },
          vehicle: true,
          driver: true
        }
      }
    },
    orderBy: { reportedAt: "desc" }
  });
}

export async function createTransportIssue(formData: FormData) {
  const profile = await getCurrentUser();

  const issueType = formData.get("issueType") as string;
  const data = {
    transportTaskId: formData.get("transportTaskId") as string,
    issueType: issueType as any, // Type assertion to handle enum
    description: formData.get("description") as string,
  };

  try {
    const issue = await prisma.transportIssue.create({
      data,
      include: {
        transportTask: {
          include: {
            cropBatch: true,
            vehicle: true,
            driver: true
          }
        }
      }
    });

    await logActivity({
      userId: profile.userId,
      action: "CREATE_TRANSPORT_ISSUE",
      entityType: "TransportIssue",
      entityId: issue.id,
      details: { issueType: data.issueType, transportTaskId: data.transportTaskId }
    });

    revalidatePath("/dashboard/transport-coordinator/issues");
    return { success: true, issue };
  } catch (error) {
    console.error("Error creating transport issue:", error);
    return { success: false, error: "Failed to create transport issue" };
  }
}

export async function updateTransportIssue(issueId: string, formData: FormData) {
  const profile = await getCurrentUser();

  const status = formData.get("status") as string;
  const data = {
    status: status as any, // Type assertion to handle enum
    resolution: formData.get("resolution") as string || null,
    resolvedAt: formData.get("status") === "RESOLVED" ? new Date() : null,
  };

  try {
    const issue = await prisma.transportIssue.update({
      where: { id: issueId },
      data,
      include: {
        transportTask: {
          include: {
            cropBatch: true,
            vehicle: true,
            driver: true
          }
        }
      }
    });

    await logActivity({
      userId: profile.userId,
      action: "UPDATE_TRANSPORT_ISSUE",
      entityType: "TransportIssue",
      entityId: issue.id,
      details: { status: data.status, resolution: data.resolution }
    });

    revalidatePath("/dashboard/transport-coordinator/issues");
    return { success: true, issue };
  } catch (error) {
    console.error("Error updating transport issue:", error);
    return { success: false, error: "Failed to update transport issue" };
  }
}

// Get available crop batches for transport assignment
export async function getAvailableCropBatches() {
  await getCurrentUser();

  return prisma.cropBatch.findMany({
    where: {
      status: "HARVESTED", // Use valid enum value
      transportTasks: {
        none: {
          status: { in: ["SCHEDULED", "IN_TRANSIT"] }
        }
      }
    },
    include: {
      farm: true
    },
    orderBy: { actualHarvest: "desc" } // Use valid field name
  });
}

// Reports and Analytics
export async function getTransportReports() {
  await getCurrentUser();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Get transport tasks for the last 30 days
  const tasks = await prisma.transportTask.findMany({
    where: {
      createdAt: {
        gte: thirtyDaysAgo
      }
    },
    include: {
      vehicle: true,
      driver: true,
      cropBatch: {
        include: {
          farm: true
        }
      },
      issues: true
    },
    orderBy: { createdAt: "desc" }
  });

  // Get issues for the last 30 days
  const issues = await prisma.transportIssue.findMany({
    where: {
      reportedAt: {
        gte: thirtyDaysAgo
      }
    },
    include: {
      transportTask: {
        include: {
          vehicle: true,
          driver: true,
          cropBatch: true
        }
      }
    }
  });

  // Calculate performance metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === "DELIVERED").length;
  const delayedTasks = tasks.filter(task => task.status === "DELAYED").length;
  const cancelledTasks = tasks.filter(task => task.status === "CANCELLED").length;
  const onTimeTasks = completedTasks - delayedTasks;

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;
  const issueRate = totalTasks > 0 ? (issues.length / totalTasks) * 100 : 0;

  // Vehicle utilization
  const vehicleStats = await prisma.vehicle.findMany({
    include: {
      transportTasks: {
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        }
      }
    }
  });

  const vehicleUtilization = vehicleStats.map(vehicle => ({
    id: vehicle.id,
    plateNumber: vehicle.plateNumber,
    type: vehicle.type,
    tasksCount: vehicle.transportTasks.length,
    utilizationRate: vehicle.transportTasks.length > 0 ? 
      (vehicle.transportTasks.filter(task => task.status === "DELIVERED").length / vehicle.transportTasks.length) * 100 : 0
  }));

  // Driver performance
  const driverStats = await prisma.driver.findMany({
    include: {
      transportTasks: {
        where: {
          createdAt: {
            gte: thirtyDaysAgo
          }
        },
        include: {
          issues: true
        }
      }
    }
  });

  const driverPerformance = driverStats.map(driver => ({
    id: driver.id,
    name: driver.name,
    tasksCount: driver.transportTasks.length,
    completedTasks: driver.transportTasks.filter(task => task.status === "DELIVERED").length,
    issuesCount: driver.transportTasks.reduce((sum, task) => sum + task.issues.length, 0),
    onTimeRate: driver.transportTasks.length > 0 ? 
      (driver.transportTasks.filter(task => task.status === "DELIVERED" && !task.issues.some(issue => issue.issueType === "TRAFFIC_DELAY" || issue.issueType === "WEATHER_DELAY")).length / driver.transportTasks.filter(task => task.status === "DELIVERED").length) * 100 : 0
  }));

  // Daily performance trends (last 7 days)
  const dailyTrends = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const dayTasks = tasks.filter(task => 
      task.createdAt >= dayStart && task.createdAt <= dayEnd
    );
    const dayIssues = issues.filter(issue => 
      issue.reportedAt >= dayStart && issue.reportedAt <= dayEnd
    );

    dailyTrends.push({
      date: dayStart.toISOString().split('T')[0],
      tasks: dayTasks.length,
      completed: dayTasks.filter(task => task.status === "DELIVERED").length,
      issues: dayIssues.length
    });
  }

  // Issue breakdown
  const issueBreakdown = issues.reduce((acc, issue) => {
    acc[issue.issueType] = (acc[issue.issueType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    overview: {
      totalTasks,
      completedTasks,
      delayedTasks,
      cancelledTasks,
      completionRate: Math.round(completionRate),
      onTimeRate: Math.round(onTimeRate),
      issueRate: Math.round(issueRate),
      totalIssues: issues.length
    },
    vehicleUtilization,
    driverPerformance,
    dailyTrends,
    issueBreakdown,
    recentTasks: tasks.slice(0, 10),
    recentIssues: issues.slice(0, 10)
  };
}

// Create Transport Schedule
export async function createTransportSchedule(formData: FormData) {
  try {
    const profile = await getCurrentUser();

    const cropBatchId = formData.get("cropBatchId") as string;
    const driverId = formData.get("driverId") as string;
    const vehicleId = formData.get("vehicleId") as string;
    const scheduledDateStr = formData.get("scheduledDate") as string;
    const pickupLocation = formData.get("pickupLocation") as string;
    const deliveryLocation = formData.get("deliveryLocation") as string;
    const notes = formData.get("notes") as string;

    if (!cropBatchId || !driverId || !vehicleId || !scheduledDateStr || !pickupLocation || !deliveryLocation) {
      return { success: false, error: "All required fields must be filled" };
    }

    const scheduledDate = new Date(scheduledDateStr);

    // Verify crop batch exists and is ready for transport
    const cropBatch = await prisma.cropBatch.findUnique({
      where: { id: cropBatchId },
      include: { farm: true }
    });

    if (!cropBatch || cropBatch.status !== "HARVESTED") {
      return { success: false, error: "Crop batch not found or not ready for transport" };
    }

    // Verify driver exists and is available
    const driver = await prisma.driver.findUnique({
      where: { id: driverId }
    });

    if (!driver || driver.status !== "AVAILABLE") {
      return { success: false, error: "Driver not found or not available" };
    }

    // Verify vehicle exists and is available
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle || vehicle.status !== "AVAILABLE") {
      return { success: false, error: "Vehicle not found or not available" };
    }

    // Check if driver/vehicle is already scheduled for the same date
    const conflictingTasks = await prisma.transportTask.findFirst({
      where: {
        OR: [
          { driverId: driverId },
          { vehicleId: vehicleId }
        ],
        scheduledDate: scheduledDate,
        status: {
          in: ["SCHEDULED", "IN_TRANSIT"]
        }
      }
    });

    if (conflictingTasks) {
      return { success: false, error: "Driver or vehicle already scheduled for this date" };
    }

    // Create the transport task
    const transportTask = await prisma.transportTask.create({
      data: {
        cropBatchId,
        driverId,
        vehicleId,
        status: "SCHEDULED",
        scheduledDate,
        pickupLocation,
        deliveryLocation,
        notes: notes || null,
        coordinatorId: profile.id,
      }
    });

    // Update crop batch status
    await prisma.cropBatch.update({
      where: { id: cropBatchId },
      data: { status: "SHIPPED" }
    });

    // Update driver and vehicle status
    await Promise.all([
      prisma.driver.update({
        where: { id: driverId },
        data: { status: "ON_DUTY" }
      }),
      prisma.vehicle.update({
        where: { id: vehicleId },
        data: { status: "IN_USE" }
      })
    ]);

    // Log activity
    await logActivity({
      userId: profile.userId,
      action: "SCHEDULE_TRANSPORT",
      entityType: "TransportTask",
      entityId: transportTask.id,
      details: {
        transportTaskId: transportTask.id,
        cropBatchId,
        driverId,
        vehicleId,
        scheduledDate: scheduledDate.toISOString()
      }
    });

    revalidatePath("/dashboard/transport-coordinator/schedule");
    revalidatePath("/dashboard/transport-coordinator/tasks");
    revalidatePath("/dashboard/transport-coordinator");

    return { success: true, transportTask };

  } catch (error) {
    console.error("Error creating transport schedule:", error);
    return { success: false, error: "Failed to create transport schedule" };
  }
}
