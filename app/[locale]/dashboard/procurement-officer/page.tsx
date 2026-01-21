import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ClipboardList, 
  CheckSquare, 
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Bell,
  Truck
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ProcurementDashboard } from '@/components/procurement/procurement-dashboard';
import { getProcurementDashboardData, assignTransportTask } from './actions';
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";

export default async function ProcurementOfficerDashboard() {
  const t = await getTranslations("procurementOfficer.dashboard");
  const locale = await getLocale();
  // Get current user authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true, name: true }
  });

  if (!currentProfile || !["procurement_officer", "admin", "manager"].includes(currentProfile.role)) {
    redirect(`/${locale}/unauthorized`);
  }

  // Get batch statistics for review
  const pendingBatches = await prisma.cropBatch.count({
    where: { 
      status: "PENDING_APPROVAL" as any // Batches ready for procurement review
    }
  });

  const approvedBatches = await prisma.cropBatch.count({
    where: { 
      status: "PROCESSED" // Approved batches
    }
  });

  const totalBatches = await prisma.cropBatch.count();

  // Get recent batches needing review
  const recentBatches = await prisma.cropBatch.findMany({
    where: {
      status: "PENDING_APPROVAL" as any
    },
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
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5
  });

  // Get transport assignment data
  let transportData = null;
  try {
    transportData = await getProcurementDashboardData(user.id);
  } catch (error) {
    console.error('Error loading transport data:', error);
  }

  const handleAssignTransport = async (data: any) => {
    'use server'
    await assignTransportTask(user.id, data)
  }

  // Get inventory stats (simplified for now)
  const inventoryStats = {
    totalItems: totalBatches,
    lowStock: Math.floor(totalBatches * 0.1), // 10% considered low stock
    outOfStock: Math.floor(totalBatches * 0.05), // 5% out of stock
    inStock: totalBatches - Math.floor(totalBatches * 0.15)
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("pendingReviews")}</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-600">{pendingBatches}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("batchesAwaitingReview")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("approvedBatches")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{approvedBatches}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("successfullyProcessed")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("lowStockItems")}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("needRestocking")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">{t("totalInventory")}</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{inventoryStats.totalItems}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {t("itemsInSystem")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <CheckSquare className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              {t("batchReviews")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("reviewAndApprove")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl font-bold text-orange-600">{pendingBatches}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("pendingReviewsCount")}</p>
              <Link href={`/${locale}/dashboard/procurement-officer/batch-reviews`}>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  {t("reviewBatches")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              {t("stockRequirements")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("setAndUpdate")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{inventoryStats.lowStock}</div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("itemsNeedAttention")}</p>
              <Link href={`/${locale}/dashboard/procurement-officer/stock-requirements`}>
                <Button variant="outline" className="w-full">
                  {t("manageRequirements")}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              {t("transportAssignment")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("assignCropBatches")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                {transportData?.cropBatches?.length || 0}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">{t("readyForTransport")}</p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="#transport-section">
                  {t("assignTransport")}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Batches for Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            {t("recentBatchesTitle")}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t("recentBatchesDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBatches.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 mx-auto mb-3 sm:mb-4 text-green-500" />
              <p className="text-sm sm:text-base">{t("noBatchesPending")}</p>
              <p className="text-xs sm:text-sm">{t("allCaughtUp")}</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {recentBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-3 sm:gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 flex-1 min-w-0">
                    <div className="flex flex-col">
                      <div className="text-sm sm:text-base font-medium truncate">{batch.batchCode}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {batch.cropType} {batch.variety && `(${batch.variety})`}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs sm:text-sm font-medium truncate">{batch.farm.name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground truncate">
                        {t("by")}: {batch.farmer.name}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-xs sm:text-xs sm:text-sm font-medium">
                        {batch.quantity} {batch.unit}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground">
                        {batch.actualHarvest ? format(new Date(batch.actualHarvest), "PPP") : "No harvest date"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2 flex-shrink-0">
                    <Badge variant="outline" className="text-orange-600 text-[10px] sm:text-xs">
                      {t("pendingReview")}
                    </Badge>
                    <Link href={`/${locale}/dashboard/procurement-officer/batch-reviews?batch=${batch.id}`}>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm">
                        {t("review")}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              
              {recentBatches.length >= 5 && (
                <div className="text-center pt-4">
                  <Link href={`/${locale}/dashboard/procurement-officer/batch-reviews`}>
                    <Button variant="outline">
                      {t("viewAllPending")}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transport Assignment Section */}
      {transportData && (
        <div id="transport-section">
          <ProcurementDashboard
            initialCropBatches={transportData.cropBatches}
            transportCoordinators={transportData.transportCoordinators}
            warehouses={transportData.warehouses}
            onAssignTransport={handleAssignTransport}
          />
        </div>
      )}
    </div>
  );
}