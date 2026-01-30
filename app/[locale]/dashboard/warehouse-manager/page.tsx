import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  PackageCheck, 
  Archive, 
  Scan,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  Warehouse
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";

export default async function WarehouseManagerDashboard() {
  const t = await getTranslations("warehouseManager.dashboard");
  const locale = await getLocale();
  // Get current user and their warehouse assignment
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    include: {
      warehouse: true
    }
  });

  if (!currentProfile || currentProfile.role !== 'warehouse_manager') {
    redirect(`/${locale}/unauthorized`);
  }

  if (!currentProfile.warehouseId) {
    redirect(`/${locale}/error?message=No warehouse assigned. Please contact your administrator.`);
  }

  const warehouseId = currentProfile.warehouseId;

  // Get packaging statistics - filtered by warehouse
  const packagingStats = await prisma.cropBatch.aggregate({
    where: {
      warehouseId: warehouseId,
      status: {
        in: ["READY_FOR_PACKAGING", "PACKAGING", "PACKAGED"]
      }
    },
    _count: true
  });

  const readyForPackaging = await prisma.cropBatch.count({
    where: { 
      warehouseId: warehouseId,
      status: "READY_FOR_PACKAGING" 
    }
  });

  const currentlyPackaging = await prisma.cropBatch.count({
    where: { 
      warehouseId: warehouseId,
      status: "PACKAGING" 
    }
  });

  const packaged = await prisma.cropBatch.count({
    where: { 
      warehouseId: warehouseId,
      status: "PACKAGED" 
    }
  });

  const stored = await prisma.cropBatch.count({
    where: { 
      warehouseId: warehouseId,
      status: "STORED" 
    }
  });

  // Get recent transport tasks for receipt scanning - filtered by warehouse
  const recentTransportTasks = await prisma.transportTask.findMany({
    where: {
      status: "DELIVERED",
      cropBatch: {
        warehouseId: warehouseId,
      }
    },
    include: {
      cropBatch: {
        include: {
          farm: {
            select: {
              name: true
            }
          }
        }
      },
      driver: {
        select: {
          name: true
        }
      },
      vehicle: {
        select: {
          plateNumber: true
        }
      }
    },
    orderBy: {
      actualDeliveryDate: 'desc'
    },
    take: 5
  });

  // Get recent packaging activities - filtered by warehouse
  const recentPackaging = await prisma.cropBatch.findMany({
    where: {
      warehouseId: warehouseId,
      status: {
        in: ["PACKAGING", "PACKAGED"]
      }
    },
    include: {
      farm: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5
  });

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <Warehouse className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm sm:text-base lg:text-lg font-medium text-green-600">
              {currentProfile.warehouse?.name} ({currentProfile.warehouse?.code})
            </p>
          </div>
        </div>
        {currentProfile.warehouse?.address && (
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            📍 {currentProfile.warehouse.address}
            {currentProfile.warehouse.city && `, ${currentProfile.warehouse.city}`}
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("readyForPackaging")}</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{readyForPackaging}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("readyForPackagingDesc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("currentlyPackaging")}</CardTitle>
            <PackageCheck className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{currentlyPackaging}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("currentlyPackagingDesc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("packaged")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{packaged}</div>
            <p className="text-xs text-muted-foreground">
              {t("packagedDesc")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("stored")}</CardTitle>
            <Archive className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-purple-600">{stored}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("storedDesc")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <PackageCheck className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
              {t("packagingManagement")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("viewPackagingDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/${locale}/dashboard/warehouse-manager/packaging`}>
                {t("managePackaging")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Scan className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-500" />
              {t("receiptScanner")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("scanReceiptButton")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/${locale}/dashboard/warehouse-manager/scanner`}>
                {t("openScanner")}
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-base sm:text-lg">
              <Archive className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-500" />
              {t("storageManagement")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("updateStorage")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/${locale}/dashboard/warehouse-manager/storage`}>
                {t("manageStorage")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Recent Deliveries for Receipt */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">{t("recentDeliveries")}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("recentDeliveriesDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransportTasks.length === 0 ? (
              <div className="text-center py-4 sm:py-6 text-muted-foreground">
                <Warehouse className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">{t("noRecentDeliveries")}</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentTransportTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium truncate">{task.cropBatch.batchCode}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {task.cropBatch.farm.name} • {task.driver.name} • {task.vehicle.plateNumber}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {t("delivered")}: {task.actualDeliveryDate ? format(new Date(task.actualDeliveryDate), "PPp") : "N/A"}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {t("readyToReceive")}
                    </Badge>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href={`/${locale}/dashboard/warehouse-manager/scanner`}>
                    {t("scanToConfirm")}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Packaging Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">{t("recentPackagingActivities")}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("recentPackagingActivitiesDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentPackaging.length === 0 ? (
              <div className="text-center py-4 sm:py-6 text-muted-foreground">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm">{t("noRecentPackaging")}</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {recentPackaging.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium truncate">{batch.batchCode}</div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {batch.farm.name} • {batch.quantity || 0}kg
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {t("updated")}: {format(new Date(batch.updatedAt), "PPp")}
                      </div>
                    </div>
                    <Badge 
                      variant={batch.status === "PACKAGED" ? "default" : "outline"}
                      className={
                        batch.status === "PACKAGED" 
                          ? "bg-green-100 text-green-800" 
                          : "text-yellow-600 border-yellow-600"
                      }
                    >
                      {batch.status === "PACKAGING" ? t("packagingInProgress") : t("packaged")}
                    </Badge>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full mt-4">
                  <Link href="/dashboard/warehouse-manager/packaging">
                    {t("manageAllPackaging")}
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}