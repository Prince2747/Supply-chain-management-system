import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Truck, 
  Users, 
  Package, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
  TrendingUp
} from "lucide-react";
import { getTransportStats, getTransportTasks, getTransportIssues, getTransportCoordinatorDashboardData, assignDriverToTransportTask, updateTransportTaskStatusAction } from "./actions";
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';

export default async function TransportCoordinatorPage() {
  const t = await getTranslations('transportCoordinator.dashboard');
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    return <div>Unauthorized</div>
  }

  try {
    // Get profile to use profile ID for coordinator tasks
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { id: true, role: true, name: true }
    });

    if (!profile) {
      return <div>Profile not found</div>
    }

    if (profile.role !== 'transport_coordinator') {
      return <div>Access denied</div>
    }

    // For now, use static data to avoid connection pool issues
    const stats = {
      totalTasks: 0,
      scheduledTasks: 0,
      inTransitTasks: 0,
      completedTasks: 0,
      totalVehicles: 0,
      availableVehicles: 0,
      totalDrivers: 0,
      availableDrivers: 0,
      openIssues: 0
    };

    const recentTasks: any[] = [];
    const recentIssues: any[] = [];

    const statCards = [
      {
        title: t('totalTasks'),
        value: stats.totalTasks,
        description: `${stats.inTransitTasks} ${t('inTransit')}`,
        icon: Package,
        color: "text-blue-600"
      },
    {
      title: t('availableVehicles'),
      value: `${stats.availableVehicles}/${stats.totalVehicles}`,
      description: t('readyForAssignment'),
      icon: Truck,
      color: "text-green-600"
    },
    {
      title: t('availableDrivers'),
      value: `${stats.availableDrivers}/${stats.totalDrivers}`,
      description: t('readyForAssignment'),
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: t('completedTasks'),
      value: stats.completedTasks,
      description: t('successfullyDelivered'),
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: t('openIssues'),
      value: stats.openIssues,
      description: t('requiringAttention'),
      icon: AlertTriangle,
      color: "text-red-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/transport-coordinator/tasks">
              <Activity className="mr-2 h-4 w-4" />
              {t('viewAllTasks')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recentTransportTasks')}</CardTitle>
            <CardDescription>{t('latestTransportAssignments')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.cropBatch.batchCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.vehicle.plateNumber} • {task.driver.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {task.status.replace('_', ' ').toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(task.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noRecentTasks')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <CardTitle>{t('recentIssues')}</CardTitle>
            <CardDescription>{t('latestTransportIssues')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentIssues.map((issue) => (
                <div key={issue.id} className="flex items-center space-x-4">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.issueType.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {issue.transportTask.vehicle.plateNumber} • {issue.transportTask.driver.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {issue.status.toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(issue.reportedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentIssues.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('noRecentIssues')}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crop Batch Transport Workflow - Temporarily disabled for debugging */}
      {/*workflowData && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Crop Batch Transport Management</h2>
          <TransportCoordinatorDashboard
            initialTransportTasks={workflowData.transportTasks}
            drivers={workflowData.drivers}
            vehicles={workflowData.vehicles}
            onAssignDriver={async (data: any) => {
              'use server'
              await assignDriverToTransportTask(profile.id, data)
            }}
            onUpdateTaskStatus={async (taskId: string, status: string) => {
              'use server'
              await updateTransportTaskStatusAction(profile.id, taskId, status)
            }}
          />
        </div>
      )*/}
    </div>
  );
  } catch (error) {
    console.error('Transport Coordinator Dashboard Error:', error);
    throw error;
  }
}
