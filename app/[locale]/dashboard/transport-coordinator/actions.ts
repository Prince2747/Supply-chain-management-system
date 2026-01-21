"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/activity-logger";
import {
  notifyTransportDriver,
  notifyAllWarehouseManagers,
} from "@/lib/notifications/unified-actions";
import { NotificationType } from "@/lib/generated/prisma";

const DASHBOARD_LOCALES = ["en", "am"] as const;

const VEHICLE_TYPES = [
  "TRUCK",
  "VAN",
  "PICKUP",
  "REFRIGERATED_TRUCK",
  "CONTAINER_TRUCK",
] as const;

const VEHICLE_STATUSES = [
  "AVAILABLE",
  "IN_USE",
  "MAINTENANCE",
  "OUT_OF_SERVICE",
] as const;

const DRIVER_STATUSES = [
  "AVAILABLE",
  "ON_DUTY",
  "OFF_DUTY",
  "SICK_LEAVE",
] as const;

const TRANSPORT_STATUSES = [
  "SCHEDULED",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "DELAYED",
] as const;

const ISSUE_TYPES = [
  "VEHICLE_BREAKDOWN",
  "TRAFFIC_DELAY",
  "WEATHER_DELAY",
  "DAMAGED_GOODS",
  "ROUTE_CHANGE",
  "OTHER",
] as const;

const ISSUE_STATUSES = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "ESCALATED",
] as const;

function revalidateDashboardPath(pathWithoutLocale: string) {
  for (const locale of DASHBOARD_LOCALES) {
    revalidatePath(`/${locale}${pathWithoutLocale}`);
  }
}

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

  // Optimize by using groupBy and aggregations instead of multiple counts
  const [taskStats, vehicleStats, driverStats, issueCount] = await Promise.all([
    prisma.transportTask.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.vehicle.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.driver.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.transportIssue.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } })
  ]);

  // Process task stats
  const totalTasks = taskStats.reduce((sum, stat) => sum + stat._count, 0);
  const scheduledTasks = taskStats.find(s => s.status === "SCHEDULED")?._count || 0;
  const inTransitTasks = taskStats.find(s => s.status === "IN_TRANSIT")?._count || 0;
  const completedTasks = taskStats.find(s => s.status === "DELIVERED")?._count || 0;

  // Process vehicle stats
  const totalVehicles = vehicleStats.reduce((sum, stat) => sum + stat._count, 0);
  const availableVehicles = vehicleStats.find(s => s.status === "AVAILABLE")?._count || 0;

  // Process driver stats
  const totalDrivers = driverStats.reduce((sum, stat) => sum + stat._count, 0);
  const availableDrivers = driverStats.find(s => s.status === "AVAILABLE")?._count || 0;

  return {
    totalTasks,
    scheduledTasks,
    inTransitTasks,
    completedTasks,
    totalVehicles,
    availableVehicles,
    totalDrivers,
    availableDrivers,
    openIssues: issueCount
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

  const cropBatchId = (formData.get("cropBatchId") as string)?.trim();
  const vehicleId = (formData.get("vehicleId") as string)?.trim();
  const driverId = (formData.get("driverId") as string)?.trim();
  const pickupLocation = (formData.get("pickupLocation") as string)?.trim();
  const deliveryLocation = (formData.get("deliveryLocation") as string)?.trim();
  const scheduledDateRaw = formData.get("scheduledDate") as string;
  const notes = (formData.get("notes") as string) || null;

  if (!cropBatchId || !vehicleId || !driverId || !pickupLocation || !deliveryLocation || !scheduledDateRaw) {
    return { success: false, error: "All required fields must be filled" };
  }

  const scheduledDate = new Date(scheduledDateRaw);
  if (Number.isNaN(scheduledDate.getTime())) {
    return { success: false, error: "Scheduled date is invalid" };
  }

  const data = {
    cropBatchId,
    vehicleId,
    driverId,
    pickupLocation,
    deliveryLocation,
    scheduledDate,
    notes,
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

    // Notify assigned driver (if linked to a user profile)
    try {
      const driverWithProfile = await prisma.driver.findUnique({
        where: { id: data.driverId },
        select: {
          Profile: {
            select: { userId: true }
          }
        }
      });

      const driverUserId = driverWithProfile?.Profile?.userId;
      if (driverUserId) {
        await notifyTransportDriver(
          driverUserId,
          NotificationType.TASK_ASSIGNED,
          'New transport task assigned',
          `New transport task assigned for batch ${task.cropBatch.batchCode}. Scheduled: ${task.scheduledDate.toLocaleDateString()}.`,
          { batchId: data.cropBatchId, batchCode: task.cropBatch.batchCode, scheduledDate: task.scheduledDate }
        );
      }
    } catch (e) {
      console.warn('Failed to notify driver for transport task:', e);
    }

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

    revalidateDashboardPath("/dashboard/transport-coordinator/tasks");
    return { success: true, task };
  } catch (error) {
    console.error("Error creating transport task:", error);
    return { success: false, error: "Failed to create transport task" };
  }
}

export async function updateTransportTask(taskId: string, formData: FormData) {
  const profile = await getCurrentUser();

  const status = (formData.get("status") as string)?.trim();
  if (!status || !TRANSPORT_STATUSES.includes(status as any)) {
    return { success: false, error: "Invalid transport status" };
  }

  const actualPickupDateRaw = formData.get("actualPickupDate") as string | null;
  const actualDeliveryDateRaw = formData.get("actualDeliveryDate") as string | null;
  const actualPickupDate = actualPickupDateRaw ? new Date(actualPickupDateRaw) : null;
  const actualDeliveryDate = actualDeliveryDateRaw ? new Date(actualDeliveryDateRaw) : null;

  if (actualPickupDate && Number.isNaN(actualPickupDate.getTime())) {
    return { success: false, error: "Actual pickup date is invalid" };
  }

  if (actualDeliveryDate && Number.isNaN(actualDeliveryDate.getTime())) {
    return { success: false, error: "Actual delivery date is invalid" };
  }

  const data = {
    status: status as any, // Type assertion to handle enum
    actualPickupDate,
    actualDeliveryDate,
    notes: (formData.get("notes") as string) || null,
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

    revalidateDashboardPath("/dashboard/transport-coordinator/tasks");
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

  const vehicleType = (formData.get("type") as string)?.trim();
  const plateNumber = (formData.get("plateNumber") as string)?.trim();
  const capacityRaw = formData.get("capacity") as string;
  const capacity = Number(capacityRaw);

  if (!plateNumber || !vehicleType) {
    return { success: false, error: "Plate number and vehicle type are required" };
  }

  if (!VEHICLE_TYPES.includes(vehicleType as any)) {
    return { success: false, error: "Invalid vehicle type" };
  }

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return { success: false, error: "Vehicle capacity must be a positive number" };
  }

  const data = {
    plateNumber,
    type: vehicleType as any, // Type assertion to handle enum
    capacity,
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

    revalidateDashboardPath("/dashboard/transport-coordinator/vehicles");
    return { success: true, vehicle };
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return { success: false, error: "Failed to create vehicle" };
  }
}

export async function updateVehicleStatus(vehicleId: string, status: string) {
  const profile = await getCurrentUser();

  if (!vehicleId) {
    return { success: false, error: "Vehicle ID is required" };
  }

  if (!status || !VEHICLE_STATUSES.includes(status as any)) {
    return { success: false, error: "Invalid vehicle status" };
  }

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

    revalidateDashboardPath("/dashboard/transport-coordinator/vehicles");
    return { success: true, vehicle };
  } catch (error) {
    console.error("Error updating vehicle status:", error);
    return { success: false, error: "Failed to update vehicle status" };
  }
}

export async function updateVehicle(vehicleId: string, formData: FormData) {
  const profile = await getCurrentUser();

  if (!vehicleId) {
    return { success: false, error: "Vehicle ID is required" };
  }

  const vehicleType = (formData.get("type") as string)?.trim();
  const plateNumber = (formData.get("plateNumber") as string)?.trim();
  const capacityRaw = formData.get("capacity") as string;
  const capacity = Number(capacityRaw);

  if (!plateNumber || !vehicleType) {
    return { success: false, error: "Plate number and vehicle type are required" };
  }

  if (!VEHICLE_TYPES.includes(vehicleType as any)) {
    return { success: false, error: "Invalid vehicle type" };
  }

  if (!Number.isFinite(capacity) || capacity <= 0) {
    return { success: false, error: "Vehicle capacity must be a positive number" };
  }

  const data = {
    plateNumber,
    type: vehicleType as any, // Type assertion to handle enum
    capacity,
  };

  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: vehicleId },
      data
    });

    await logActivity({
      userId: profile.userId,
      action: "UPDATE_VEHICLE",
      entityType: "Vehicle",
      entityId: vehicle.id,
      details: { plateNumber: data.plateNumber, type: data.type, capacity: data.capacity }
    });

    revalidateDashboardPath("/dashboard/transport-coordinator/vehicles");
    return { success: true, vehicle };
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return { success: false, error: "Failed to update vehicle" };
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

  const name = (formData.get("name") as string)?.trim();
  const licenseNumber = (formData.get("licenseNumber") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;

  if (!name || !licenseNumber || !phone) {
    return { success: false, error: "Name, license number, and phone are required" };
  }

  const data = {
    name,
    licenseNumber,
    phone,
    email,
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

    revalidateDashboardPath("/dashboard/transport-coordinator/drivers");
    return { success: true, driver };
  } catch (error) {
    console.error("Error creating driver:", error);
    return { success: false, error: "Failed to create driver" };
  }
}

export async function updateDriverStatus(driverId: string, status: string) {
  const profile = await getCurrentUser();

  if (!driverId) {
    return { success: false, error: "Driver ID is required" };
  }

  if (!status || !DRIVER_STATUSES.includes(status as any)) {
    return { success: false, error: "Invalid driver status" };
  }

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

    revalidateDashboardPath("/dashboard/transport-coordinator/drivers");
    return { success: true, driver };
  } catch (error) {
    console.error("Error updating driver status:", error);
    return { success: false, error: "Failed to update driver status" };
  }
}

export async function updateDriver(driverId: string, formData: FormData) {
  const profile = await getCurrentUser();

  if (!driverId) {
    return { success: false, error: "Driver ID is required" };
  }

  const name = (formData.get("name") as string)?.trim();
  const licenseNumber = (formData.get("licenseNumber") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;

  if (!name || !licenseNumber || !phone) {
    return { success: false, error: "Name, license number, and phone are required" };
  }

  const data = {
    name,
    licenseNumber,
    phone,
    email,
  };

  try {
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data
    });

    await logActivity({
      userId: profile.userId,
      action: "UPDATE_DRIVER",
      entityType: "Driver",
      entityId: driver.id,
      details: { name: data.name, licenseNumber: data.licenseNumber }
    });

    revalidateDashboardPath("/dashboard/transport-coordinator/drivers");
    return { success: true, driver };
  } catch (error) {
    console.error("Error updating driver:", error);
    return { success: false, error: "Failed to update driver" };
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

  const issueType = (formData.get("issueType") as string)?.trim();
  const transportTaskId = (formData.get("transportTaskId") as string)?.trim();
  const description = (formData.get("description") as string)?.trim();

  if (!transportTaskId || !issueType || !description) {
    return { success: false, error: "All required fields must be filled" };
  }

  if (!ISSUE_TYPES.includes(issueType as any)) {
    return { success: false, error: "Invalid issue type" };
  }

  const data = {
    transportTaskId,
    issueType: issueType as any, // Type assertion to handle enum
    description,
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

    revalidateDashboardPath("/dashboard/transport-coordinator/issues");
    return { success: true, issue };
  } catch (error) {
    console.error("Error creating transport issue:", error);
    return { success: false, error: "Failed to create transport issue" };
  }
}

export async function updateTransportIssue(issueId: string, formData: FormData) {
  const profile = await getCurrentUser();

  const status = (formData.get("status") as string)?.trim();
  if (!status || !ISSUE_STATUSES.includes(status as any)) {
    return { success: false, error: "Invalid issue status" };
  }

  const resolution = (formData.get("resolution") as string) || null;
  if (status === "RESOLVED" && !resolution?.trim()) {
    return { success: false, error: "Resolution is required when resolving an issue" };
  }

  const data = {
    status: status as any, // Type assertion to handle enum
    resolution: resolution?.trim() || null,
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

    revalidateDashboardPath("/dashboard/transport-coordinator/issues");
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

    const cropBatchId = (formData.get("cropBatchId") as string)?.trim();
    const driverId = (formData.get("driverId") as string)?.trim();
    const vehicleId = (formData.get("vehicleId") as string)?.trim();
    const scheduledDateStr = (formData.get("scheduledDate") as string)?.trim();
    const pickupLocation = (formData.get("pickupLocation") as string)?.trim();
    const deliveryLocation = (formData.get("deliveryLocation") as string)?.trim();
    const notes = (formData.get("notes") as string) || null;

    if (!cropBatchId || !driverId || !vehicleId || !scheduledDateStr || !pickupLocation || !deliveryLocation) {
      return { success: false, error: "All required fields must be filled" };
    }

    const scheduledDate = new Date(scheduledDateStr);
    if (Number.isNaN(scheduledDate.getTime())) {
      return { success: false, error: "Scheduled date is invalid" };
    }

    // Verify crop batch exists and is ready for transport scheduling
    const cropBatch = await prisma.cropBatch.findUnique({
      where: { id: cropBatchId },
      include: {
        farm: true,
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            city: true,
          }
        }
      }
    });

    const eligibleCropBatchStatuses = [
      "HARVESTED",
      "PROCESSED",
      "READY_FOR_PACKAGING",
      "PACKAGED",
    ] as const;

    if (!cropBatch || !eligibleCropBatchStatuses.includes(cropBatch.status as any)) {
      return { success: false, error: "Crop batch not found or not ready for transport" };
    }

    if (!cropBatch.warehouseId) {
      return { success: false, error: "No destination warehouse assigned. Procurement must assign a warehouse before scheduling transport." };
    }

    // Prevent duplicate scheduling for the same crop batch
    const existingActiveTaskForBatch = await prisma.transportTask.findFirst({
      where: {
        cropBatchId,
        status: {
          in: ["SCHEDULED", "IN_TRANSIT"],
        },
      },
      select: { id: true },
    });

    if (existingActiveTaskForBatch) {
      return { success: false, error: "This crop batch already has an active transport task" };
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
        notes,
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

    // Notify destination warehouse managers that a delivery is scheduled.
    try {
      const warehouseManagers = await prisma.profile.findMany({
        where: {
          role: 'warehouse_manager',
          isActive: true,
          warehouseId: cropBatch.warehouseId,
        },
        select: { userId: true },
      });

      if (warehouseManagers.length > 0) {
        const warehouseLabel = cropBatch.warehouse ? `${cropBatch.warehouse.name} (${cropBatch.warehouse.code})` : 'your warehouse';
        await notifyAllWarehouseManagers(
          cropBatch.warehouseId!,
          NotificationType.SHIPMENT_ARRIVING,
          'Shipment scheduled',
          `Transport scheduled: Batch ${cropBatch.batchCode} is scheduled for delivery to ${warehouseLabel} on ${scheduledDate.toLocaleDateString()}.`,
          { batchId: cropBatchId, batchCode: cropBatch.batchCode, scheduledDate }
        );
      }
    } catch (e) {
      console.warn('Failed to notify warehouse managers on scheduling:', e);
    }

    revalidateDashboardPath("/dashboard/transport-coordinator/schedule");
    revalidateDashboardPath("/dashboard/transport-coordinator/tasks");
    revalidateDashboardPath("/dashboard/transport-coordinator");

    return { success: true, transportTask };

  } catch (error) {
    console.error("Error creating transport schedule:", error);
    return { success: false, error: "Failed to create transport schedule" };
  }
}

// New functions for crop batch workflow
export async function getTransportCoordinatorTasks(coordinatorId: string) {
  try {
    const transportTasks = await prisma.transportTask.findMany({
      where: {
        coordinatorId: coordinatorId
      },
      include: {
        cropBatch: {
          include: {
            farm: {
              select: {
                name: true,
                location: true
              }
            },
            farmer: {
              select: {
                name: true
              }
            }
          }
        },

        driver: {
          select: {
            id: true,
            name: true,
            licenseNumber: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            type: true,
            capacity: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    })

    return transportTasks
  } catch (error) {
    console.error('Error fetching transport tasks:', error)
    throw new Error('Failed to fetch transport tasks')
  }
}

export async function assignDriverToTransportTask(
  coordinatorId: string,
  data: {
    transportTaskId: string
    driverId: string
    vehicleId: string
    scheduledDate?: Date
    notes?: string
  }
) {
  try {
    const profile = await getCurrentUser();
    if (profile.userId !== coordinatorId) {
      throw new Error('Unauthorized')
    }

    if (!data.transportTaskId || !data.driverId || !data.vehicleId) {
      throw new Error('Transport task, driver, and vehicle are required')
    }

    if (data.scheduledDate && Number.isNaN(data.scheduledDate.getTime())) {
      throw new Error('Scheduled date is invalid')
    }

    // Verify the transport task exists and belongs to this coordinator
    const transportTask = await prisma.transportTask.findFirst({
      where: {
        id: data.transportTaskId,
        coordinatorId: coordinatorId,
        status: 'SCHEDULED'
      },
      include: {
        cropBatch: true
      }
    })

    if (!transportTask) {
      throw new Error('Transport task not found or not available for assignment')
    }

    // Verify the driver exists and is available
    const driver = await prisma.driver.findFirst({
      where: {
        id: data.driverId,
        status: 'AVAILABLE'
      }
    })

    if (!driver) {
      throw new Error('Driver not found or not available')
    }

    // Verify the vehicle exists and is available
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: data.vehicleId,
        status: 'AVAILABLE'
      }
    })

    if (!vehicle) {
      throw new Error('Vehicle not found or not available')
    }

    // Update transport task with driver and vehicle assignment
    const updatedTask = await prisma.transportTask.update({
      where: { id: data.transportTaskId },
      data: {
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        scheduledDate: data.scheduledDate || transportTask.scheduledDate,
        notes: data.notes ? `${transportTask.notes || ''}\n${data.notes}`.trim() : transportTask.notes,
        status: 'SCHEDULED'
      }
    })

    // Update driver status to ON_DUTY
    await prisma.driver.update({
      where: { id: data.driverId },
      data: { status: 'ON_DUTY' }
    })

    // Update vehicle status to IN_USE
    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: 'IN_USE' }
    })

    // Log the activity
    await logActivity({
      userId: coordinatorId,
      action: 'ASSIGN_DRIVER_VEHICLE',
      entityType: 'TransportTask',
      entityId: data.transportTaskId,
      details: {
        transportTaskId: data.transportTaskId,
        driverId: data.driverId,
        vehicleId: data.vehicleId,
        cropBatchId: transportTask.cropBatchId
      }
    })

    revalidateDashboardPath('/dashboard/transport-coordinator')
    
    return { success: true, updatedTask }
  } catch (error) {
    console.error('Error assigning driver to task:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to assign driver to task')
  }
}

export async function updateTransportTaskStatusAction(
  coordinatorId: string,
  taskId: string,
  status: string
) {
  try {
    const profile = await getCurrentUser();
    if (profile.userId !== coordinatorId) {
      throw new Error('Unauthorized')
    }

    if (!status || !TRANSPORT_STATUSES.includes(status as any)) {
      throw new Error('Invalid transport status')
    }

    // Verify the transport task exists and belongs to this coordinator
    const transportTask = await prisma.transportTask.findFirst({
      where: {
        id: taskId,
        coordinatorId: coordinatorId
      },
      include: {
        cropBatch: true,
        driver: true,
        vehicle: true
      }
    })

    if (!transportTask) {
      throw new Error('Transport task not found')
    }

    const updateData: any = { status }

    // Set timestamps based on status
    if (status === 'IN_TRANSIT') {
      updateData.actualPickupDate = new Date()
    } else if (status === 'DELIVERED') {
      updateData.actualDeliveryDate = new Date()

      // IMPORTANT: Do not mark the crop batch as RECEIVED here.
      // Delivery (driver/coordinator) is not the same as warehouse receipt confirmation.
      // Warehouse managers confirm receipt via the scanner endpoint, which sets RECEIVED.

      // Free up the driver and vehicle
      if (transportTask.driverId) {
        await prisma.driver.update({
          where: { id: transportTask.driverId },
          data: { status: 'AVAILABLE' }
        })
      }

      if (transportTask.vehicleId) {
        await prisma.vehicle.update({
          where: { id: transportTask.vehicleId },
          data: { status: 'AVAILABLE' }
        })
      }
    }

    // Update the task
    const updatedTask = await prisma.transportTask.update({
      where: { id: taskId },
      data: updateData
    })

    // Log the activity
    await logActivity({
      userId: coordinatorId,
      action: 'UPDATE_TRANSPORT_STATUS',
      entityType: 'TransportTask',
      entityId: taskId,
      details: {
        transportTaskId: taskId,
        previousStatus: transportTask.status,
        newStatus: status,
        cropBatchId: transportTask.cropBatchId
      }
    })

    revalidateDashboardPath('/dashboard/transport-coordinator')
    
    return { success: true, updatedTask }
  } catch (error) {
    console.error('Error updating transport task status:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to update transport task status')
  }
}

export async function getTransportCoordinatorDashboardData(coordinatorId: string) {
  try {
    const [transportTasks, allDrivers, allVehicles] = await Promise.all([
      getTransportCoordinatorTasks(coordinatorId),
      getDrivers(),
      getVehicles()
    ])

    return {
      transportTasks,
      drivers: allDrivers,
      vehicles: allVehicles
    }
  } catch (error) {
    console.error('Error fetching transport coordinator dashboard data:', error)
    throw new Error('Failed to fetch dashboard data')
  }
}
