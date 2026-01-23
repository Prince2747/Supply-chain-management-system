import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TransportTasksClient } from "@/components/transport-coordinator/transport-tasks-client";
import { Calendar, Package, Truck, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

export default async function TransportTasksPage() {
  const t = await getTranslations("transportCoordinator.tasks");
  
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
    <div className="space-y-4 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("totalTasks")}</CardTitle>
            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("allTransportTasks")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("pending")}</CardTitle>
            <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.scheduled + stats.inTransit}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("awaitingAssignment")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("completed")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.delivered}</div>
            <p className="text-xs text-muted-foreground">
              {t("successfullyDelivered")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("delayed")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withIssues}</div>
            <p className="text-xs text-muted-foreground">
              {t("behindSchedule")}
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