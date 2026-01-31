import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StorageManagementClient } from "@/components/warehouse-manager/storage-management-client";
import { Archive, Package, CheckCircle } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";

export default async function StoragePage() {
  const t = await getTranslations("warehouseManager.storage");
  const locale = await getLocale();
  // Get current user and their warehouse assignment
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { warehouseId: true, role: true }
  });

  if (!currentProfile || currentProfile.role !== 'warehouse_manager' || !currentProfile.warehouseId) {
    redirect(`/${locale}/unauthorized`);
  }

  // Get all received batches and stored batches - filtered by warehouse
  const storageBatches = await prisma.cropBatch.findMany({
    where: {
      warehouseId: currentProfile.warehouseId,
      status: {
        in: ["RECEIVED", "STORED"]
      }
    },
    include: {
      farm: {
        select: {
          name: true,
          location: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // Calculate stats
  const stats = {
    received: storageBatches.filter(b => b.status === "RECEIVED").length,
    stored: storageBatches.filter(b => b.status === "STORED").length,
    totalQuantity: storageBatches
      .filter(b => b.status === "STORED")
      .reduce((sum, batch) => sum + (batch.quantity || 0), 0),
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("received")}</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.received}</div>
            <p className="text-xs text-muted-foreground">
              {t("readyForStorageVerification")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("stored")}</CardTitle>
            <Archive className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.stored}</div>
            <p className="text-xs text-muted-foreground">
              {t("verifiedAndStored")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("totalInventory")}</CardTitle>
            <CheckCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.totalQuantity}kg</div>
            <p className="text-xs text-muted-foreground">
              {t("inWarehouseStorage")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Storage Management */}
      <Card>
        <CardHeader>
          <CardTitle>{t("batchStorageManagement")}</CardTitle>
          <CardDescription>
            {t("verifyAndUpdate")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StorageManagementClient 
            batches={storageBatches}
            stats={stats}
          />
        </CardContent>
      </Card>
    </div>
  );
}