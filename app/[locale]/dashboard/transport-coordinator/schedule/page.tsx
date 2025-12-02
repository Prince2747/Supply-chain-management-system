import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleTransportForm } from "@/components/transport-coordinator/schedule-transport-form";
import { PendingSchedules } from "@/components/transport-coordinator/pending-schedules";
import { Calendar, Truck, MapPin } from "lucide-react";

export default async function SchedulePage() {
  // Get crop batches that are ready for transport (harvested)
  const availableCropBatches = await prisma.cropBatch.findMany({
    where: {
      status: "HARVESTED",
    },
    include: {
      farm: {
        select: {
          name: true,
          location: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get available drivers (available status)
  const availableDrivers = await prisma.driver.findMany({
    where: {
      status: "AVAILABLE",
    },
    select: {
      id: true,
      name: true,
      licenseNumber: true,
      phone: true,
    },
  });

  // Get available vehicles (available status)
  const availableVehicles = await prisma.vehicle.findMany({
    where: {
      status: "AVAILABLE",
    },
    select: {
      id: true,
      plateNumber: true,
      type: true,
      capacity: true,
    },
  });

  // Get pending transport tasks (scheduled but not started)
  const pendingTasks = await prisma.transportTask.findMany({
    where: {
      status: "SCHEDULED",
    },
    include: {
      cropBatch: {
        include: {
          farm: {
            select: {
              name: true,
            },
          },
        },
      },
      driver: {
        select: {
          name: true,
        },
      },
      vehicle: {
        select: {
          plateNumber: true,
          type: true,
        },
      },
    },
    orderBy: {
      scheduledDate: "asc",
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Schedule Transport Tasks</h1>
        <p className="text-muted-foreground">
          Create and manage transport schedules for approved crop batches
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Batches</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCropBatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for transport
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Resources</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availableDrivers.length}/{availableVehicles.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Drivers/Vehicles ready
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for pickup
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Schedule Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create Transport Schedule</CardTitle>
            <CardDescription>
              Assign drivers and vehicles to transport approved crop batches
            </CardDescription>
          </CardHeader>
          <CardContent>
          <ScheduleTransportForm
            cropBatches={availableCropBatches}
            drivers={availableDrivers}
            vehicles={availableVehicles}
          />
          </CardContent>
        </Card>

        {/* Pending Schedules */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Transport Tasks</CardTitle>
            <CardDescription>
              Recently scheduled tasks awaiting execution
            </CardDescription>
          </CardHeader>
          <CardContent>
          <PendingSchedules tasks={pendingTasks} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}