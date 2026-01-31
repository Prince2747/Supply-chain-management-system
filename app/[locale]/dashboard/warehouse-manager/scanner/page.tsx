import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { QRScannerClient } from "@/components/warehouse-manager/qr-scanner-client";
import { Badge } from "@/components/ui/badge";
import { Scan, Package, Truck } from "lucide-react";
import { format } from "date-fns";
import { getLocale, getTranslations } from "next-intl/server";

export default async function QRScannerPage() {
  const t = await getTranslations("warehouseManager.scanner");
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

  // Get delivered transport tasks that are ready for receipt confirmation - filtered by warehouse
  const deliveredTasks = await prisma.transportTask.findMany({
    where: {
      status: "DELIVERED",
      cropBatch: {
        warehouseId: currentProfile.warehouseId,
        status: { in: ["SHIPPED", "PACKAGED"] } // Awaiting warehouse receipt confirmation
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
          name: true,
          phone: true
        }
      },
      vehicle: {
        select: {
          plateNumber: true,
          type: true
        }
      }
    },
    orderBy: {
      actualDeliveryDate: 'desc'
    }
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Scanner and Instructions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* QR Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scan className="h-5 w-5 mr-2 text-green-500" />
              {t("qrCodeScanner")}
            </CardTitle>
            <CardDescription>
              {t("positionQRCode")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QRScannerClient />
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>{t("howToUse")}</CardTitle>
            <CardDescription>
              {t("followSteps")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">{t("step1Title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("step1Desc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">{t("step2Title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("step2Desc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">{t("step3Title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("step3Desc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-sm font-medium mt-0.5">
                  4
                </div>
                <div>
                  <p className="font-medium">{t("step4Title")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("step4Desc")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Delivered Batches */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentDeliveriesTitle")}</CardTitle>
          <CardDescription>
            {t("recentDeliveriesDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deliveredTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>{t("noDeliveries")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveredTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium">{task.cropBatch.batchCode}</h4>
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        {t("delivered")}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 mr-2" />
                        <span>{task.cropBatch.cropType} • {task.cropBatch.farm.name}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 mr-2" />
                        <span>{task.driver.name} • {task.vehicle.plateNumber}</span>
                      </div>
                      
                      <div>
                        <span>{t("deliveredOn")}: {task.actualDeliveryDate ? format(new Date(task.actualDeliveryDate), "PPp") : "N/A"}</span>
                      </div>
                    </div>
                    
                    {task.cropBatch.quantity && (
                      <div className="text-sm text-muted-foreground mt-1">
                        {t("quantity")}: {task.cropBatch.quantity}kg
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <Badge variant="secondary">
                      {t("readyToScan")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}