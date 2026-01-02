import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Building, 
  Users, 
  Sprout, 
  QrCode, 
  TrendingUp, 
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { CropBatchStatus, NotificationType } from "@/lib/generated/prisma/client";
import { getTranslations, getLocale } from 'next-intl/server';

async function getDashboardStats(userId: string) {
  try {
    // Get all counts for the field agent
    const [
      totalFarms,
      totalFarmers,
      activeCropBatches,
      pendingHarvests,
      qrCodesGenerated,
      unreadNotifications,
      thisMonthRegistrations,
      completedInspections
    ] = await Promise.all([
      // Total farms registered by this field agent
      prisma.farm.count({
        where: { registeredBy: userId }
      }),
      
      // Total farmers registered by this field agent
      prisma.farmer.count({
        where: { registeredBy: userId }
      }),
      
      // Active crop batches (not harvested yet)
      prisma.cropBatch.count({
        where: {
          createdBy: userId,
          status: {
            in: [CropBatchStatus.PLANTED, CropBatchStatus.GROWING]
          }
        }
      }),
      
      // Crop batches ready for harvest
      prisma.cropBatch.count({
        where: {
          createdBy: userId,
          status: CropBatchStatus.READY_FOR_HARVEST
        }
      }),
      
      // QR codes generated (crop batches with QR codes)
      prisma.cropBatch.count({
        where: {
          createdBy: userId,
          qrCode: {
            not: null
          }
        }
      }),
      
      // Unread notifications for this field agent
      prisma.harvestNotification.count({
        where: {
          sentTo: userId,
          isRead: false
        }
      }),
      
      // Farmers registered this month
      prisma.farmer.count({
        where: {
          registeredBy: userId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // Completed inspections by this field agent
      prisma.farmInspection.count({
        where: {
          inspectedBy: userId
        }
      })
    ]);

    return {
      totalFarms,
      totalFarmers,
      activeCropBatches,
      pendingHarvests,
      qrCodesGenerated,
      unreadNotifications,
      thisMonthRegistrations,
      completedInspections
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return {
      totalFarms: 0,
      totalFarmers: 0,
      activeCropBatches: 0,
      pendingHarvests: 0,
      qrCodesGenerated: 0,
      unreadNotifications: 0,
      thisMonthRegistrations: 0,
      completedInspections: 0
    };
  }
}

async function getRecentActivities(userId: string) {
  try {
    // Get recent activity logs for this field agent
    const activities = await prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return activities.map(activity => ({
      id: activity.id,
      action: activity.action,
      details: activity.details as any,
      createdAt: activity.createdAt
    }));
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

function formatTimeAgo(date: Date, t: any): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${t(minutes === 1 ? 'minute' : 'minutes')} ${t('ago')}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${t(hours === 1 ? 'hour' : 'hours')} ${t('ago')}`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${t(days === 1 ? 'day' : 'days')} ${t('ago')}`;
  }
}

export default async function FieldAgentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getTranslations('fieldAgent.dashboard');
  const locale = await getLocale();
  
  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  const stats = await getDashboardStats(user.id);
  const recentActivities = await getRecentActivities(user.id);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('title')}</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('totalFarms')}</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalFarms}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              +{stats.thisMonthRegistrations} {t('newThisMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('registeredFarmers')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.totalFarmers}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t('activePartnerships')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('activeBatches')}</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.activeCropBatches}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {stats.pendingHarvests} {t('pendingHarvest')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('qrCodes')}</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{stats.qrCodesGenerated}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t('generatedThisMonth')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {t('farmerManagement')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('farmerManagementDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/${locale}/dashboard/field-agent/farmers`}>
                {t('viewAllFarmers')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Building className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {t('farmOperations')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('farmOperationsDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/${locale}/dashboard/field-agent/farms`}>
                {t('manageFarms')}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Sprout className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              {t('cropBatches')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('cropBatchesDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/${locale}/dashboard/field-agent/crops`}>
                {t('viewBatches')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base sm:text-lg">
            <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            {t('recentActivities')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t('recentActivitiesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-2 sm:space-x-4 p-2 sm:p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900">
                      {activity.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    {activity.details && (
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                        {typeof activity.details === 'object' ? JSON.stringify(activity.details) : activity.details}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-[10px] sm:text-xs text-gray-400">
                    {formatTimeAgo(activity.createdAt, t)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-3 sm:py-4">
                <p className="text-xs sm:text-sm">{t('noRecentActivities')}</p>
                <p className="text-[10px] sm:text-xs">{t('noRecentActivitiesDesc')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
