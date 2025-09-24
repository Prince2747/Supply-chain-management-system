import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TransportTasksClient } from "@/components/transport-coordinator/transport-tasks-client";
import { Calendar, Package, Truck, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

export default async function TransportTasksPage() {
  // Get all transport tasks with related data
  const transportTasks = await prisma.transportTask.findMany({
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
          phone: true,
        },
      },
      vehicle: {
        select: {
          plateNumber: true,
          type: true,
        },
      },
      coordinator: {
        select: {
          name: true,
        },
      },
      issues: {
        where: {
          status: {
            in: ["OPEN", "IN_PROGRESS"],
          },
        },
      },
    },
    orderBy: {
      scheduledDate: "desc",
    },
  });

  // Calculate stats
  const stats = {
    total: transportTasks.length,
    scheduled: transportTasks.filter(task => task.status === "SCHEDULED").length,
    inTransit: transportTasks.filter(task => task.status === "IN_TRANSIT").length,
    delivered: transportTasks.filter(task => task.status === "DELIVERED").length,
    cancelled: transportTasks.filter(task => task.status === "CANCELLED").length,
    delayed: transportTasks.filter(task => task.status === "DELAYED").length,
    withIssues: transportTasks.filter(task => task.issues.length > 0).length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transport Tasks</h1>
        <p className="text-muted-foreground">
          Manage and monitor all transport tasks across your fleet
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All transport tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled + stats.inTransit}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled + In Transit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">
              Successfully delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withIssues}</div>
            <p className="text-xs text-muted-foreground">
              Tasks with open issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Management */}
      <Card>
        <CardHeader>
          <CardTitle>All Transport Tasks</CardTitle>
          <CardDescription>
            View, filter, and manage transport tasks with real-time status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransportTasksClient 
            tasks={transportTasks}
            stats={stats}
          />
        </CardContent>
      </Card>
    </div>
  );
}