import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PackagingManagementClient } from "@/components/warehouse-manager/packaging-management-client";
import { Package, PackageCheck, Clock } from "lucide-react";

export default async function PackagingPage() {
  // Get current user and their warehouse assignment
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { warehouseId: true, role: true }
  });

  if (!currentProfile || currentProfile.role !== 'warehouse_manager' || !currentProfile.warehouseId) {
    redirect('/unauthorized');
  }

  // Get all crop batches ready for packaging or currently being packaged - filtered by warehouse
  const packagingBatches = await prisma.cropBatch.findMany({
    where: {
      warehouseId: currentProfile.warehouseId,
      status: {
        in: ["READY_FOR_PACKAGING", "PACKAGING", "PACKAGED"]
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
    readyForPackaging: packagingBatches.filter(b => b.status === "READY_FOR_PACKAGING").length,
    currentlyPackaging: packagingBatches.filter(b => b.status === "PACKAGING").length,
    packaged: packagingBatches.filter(b => b.status === "PACKAGED").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Packaging Management</h1>
        <p className="text-muted-foreground">
          Oversee packaging operations and update batch packaging status
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Packaging</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.readyForPackaging}</div>
            <p className="text-xs text-muted-foreground">
              Batches awaiting packaging
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.currentlyPackaging}</div>
            <p className="text-xs text-muted-foreground">
              Currently being packaged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <PackageCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.packaged}</div>
            <p className="text-xs text-muted-foreground">
              Ready for shipment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Packaging Management */}
      <Card>
        <CardHeader>
          <CardTitle>Crop Batch Packaging</CardTitle>
          <CardDescription>
            Monitor and update packaging status for crop batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PackagingManagementClient 
            batches={packagingBatches}
            stats={stats}
          />
        </CardContent>
      </Card>
    </div>
  );
}