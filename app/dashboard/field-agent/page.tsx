import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Building, 
  Users, 
  Bell, 
  Sprout, 
  QrCode, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { CropBatchStatus, NotificationType } from "@/lib/generated/prisma/client";

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
      time: formatTimeAgo(activity.createdAt)
    }));
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
}

export default async function FieldAgentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <div>Please log in to access this page.</div>;
  }

  const stats = await getDashboardStats(user.id);
  const recentActivities = await getRecentActivities(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Field Agent Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/field-agent/notifications">
              <Bell className="mr-2 h-4 w-4" />
              {stats.unreadNotifications} Notifications
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Farms</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFarms}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.thisMonthRegistrations} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered Farmers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFarmers}</div>
            <p className="text-xs text-muted-foreground">
              Active partnerships
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCropBatches}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingHarvests} pending harvest
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.qrCodesGenerated}</div>
            <p className="text-xs text-muted-foreground">
              Generated this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Farmer Management
            </CardTitle>
            <CardDescription>
              Register new farmers and manage existing profiles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/field-agent/farmers">
                View All Farmers
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2 h-5 w-5" />
              Farm Operations
            </CardTitle>
            <CardDescription>
              Record farm details and track operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/field-agent/farms">
                Manage Farms
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Sprout className="mr-2 h-5 w-5" />
              Crop Batches
            </CardTitle>
            <CardDescription>
              Create and track crop batches with QR codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/field-agent/crops">
                View Batches
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Your latest field operations and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg bg-gray-50">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    {activity.details && (
                      <p className="text-sm text-gray-500">
                        {typeof activity.details === 'object' ? JSON.stringify(activity.details) : activity.details}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-400">
                    {activity.time}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 py-4">
                <p className="text-sm">No recent activities</p>
                <p className="text-xs">Start by registering farmers or creating crop batches</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5 text-orange-500" />
            Pending Tasks
          </CardTitle>
          <CardDescription>
            Items requiring your attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50">
              <div>
                <p className="text-sm font-medium">Farm inspection due</p>
                <p className="text-xs text-gray-600">Meadow Creek Farm - Due tomorrow</p>
              </div>
              <Button size="sm" variant="outline">
                <MapPin className="mr-1 h-3 w-3" />
                View
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50">
              <div>
                <p className="text-sm font-medium">Harvest notifications</p>
                <p className="text-xs text-gray-600">{stats.pendingHarvests} farms ready for harvest</p>
              </div>
              <Button size="sm" variant="outline">
                <Bell className="mr-1 h-3 w-3" />
                Review
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50">
              <div>
                <p className="text-sm font-medium">QR codes to generate</p>
                <p className="text-xs text-gray-600">3 new crop batches awaiting QR codes</p>
              </div>
              <Button size="sm" variant="outline">
                <QrCode className="mr-1 h-3 w-3" />
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
