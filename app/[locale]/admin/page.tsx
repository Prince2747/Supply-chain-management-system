import { Role } from "@/lib/generated/prisma/client";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  UserPlus,
  Shield,
  Activity,
  Warehouse,
  Ruler,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

async function getDashboardStats() {
  const supabase = await createClient();

  // Get total users count
  const totalUsers = await prisma.profile.count();

  // Get users count by role
  const adminUsers = await prisma.profile.count({
    where: { role: Role.admin },
  });

  const staffUsers = await prisma.profile.count({
    where: { 
      role: {
        in: [
          Role.manager,
          Role.field_agent,
          Role.procurement_officer,
          Role.warehouse_manager,
          Role.transport_driver
        ]
      }
    },
  });

  // Get recent users (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentUsers = await prisma.profile.count({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  // Get warehouse stats
  const totalWarehouses = await prisma.warehouse.count();
  const activeWarehouses = await prisma.warehouse.count({
    where: { isActive: true },
  });

  // Get units stats
  const totalUnits = await prisma.unitOfMeasurement.count();
  const activeUnits = await prisma.unitOfMeasurement.count({
    where: { isActive: true },
  });

  // Get recent activity (last 24 hours)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const recentActivity = await prisma.activityLog.count({
    where: {
      createdAt: {
        gte: twentyFourHoursAgo,
      },
    },
  });

  // Get last 5 activity logs
  const recentActivityLogs = await prisma.activityLog.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Fetch user details for the activity logs
  const activityLogsWithUsers = await Promise.all(
    recentActivityLogs.map(async (log) => {
      const user = await prisma.profile.findUnique({
        where: { id: log.userId },
        select: { name: true, role: true },
      });
      return {
        ...log,
        user,
        detailsString: log.details ? JSON.stringify(log.details) : null,
      };
    })
  );

  return {
    totalUsers,
    adminUsers,
    staffUsers,
    recentUsers,
    totalWarehouses,
    activeWarehouses,
    totalUnits,
    activeUnits,
    recentActivity,
    recentActivityLogs: activityLogsWithUsers,
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const t = await getTranslations('admin.dashboardPage');

  return (
    <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
            <p className="text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('totalUsers')}
                </CardTitle>
                <img src="/logo.png" alt="Company Logo" className="h-6 w-6 object-contain" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.adminUsers} {t('admins')}, {stats.staffUsers} {t('staff')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('activeWarehouses')}
                </CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.activeWarehouses}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('outOf')} {stats.totalWarehouses} {t('totalWarehouses')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('unitsOfMeasurement')}
                </CardTitle>
                <Ruler className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUnits}</div>
                <p className="text-xs text-muted-foreground">
                  {t('activeMeasurementUnits')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('recentActivity')}
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentActivity}</div>
                <p className="text-xs text-muted-foreground">
                  {t('actionsInLast24Hours')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>{t('recentActivities')}</CardTitle>
              <CardDescription>{t('last5ActivityLogs')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentActivityLogs.length > 0 ? (
                  stats.recentActivityLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="flex items-start space-x-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-foreground">
                            {log.user?.name || t('unknownUser')}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.createdAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.action}
                        </p>
                        {log.detailsString && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {log.detailsString}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{t('noRecentActivityLogs')}</p>
                  </div>
                )}
                
                {stats.recentActivityLogs.length > 0 && (
                  <div className="pt-2">
                    <Link
                      href="/admin/logs"
                      className="text-sm text-primary hover:underline inline-flex items-center"
                    >
                      {t('viewAllActivityLogs')}
                      <Activity className="ml-1 h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
    </div>
  );
}
