import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { InventoryMonitorClient } from "@/components/procurement-officer/inventory-monitor-client";
import { getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import { getStockRequirementsFromDb } from "../actions";

export default async function InventoryMonitorPage() {
  const t = await getTranslations("procurementOfficer.inventory");
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

  if (!currentProfile || !['procurement_officer', 'admin', 'manager'].includes(currentProfile.role)) {
    redirect(`/${locale}/unauthorized`);
  }

  // Get detailed inventory data
  const inventoryData = await prisma.cropBatch.findMany({
    where: {
      status: {
        in: ['PROCESSED', 'SHIPPED', 'RECEIVED', 'STORED'] // Include in-transit batches
      }
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
      },
      warehouse: {
        select: {
          name: true,
          address: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  // Get crop-wise summary
  const cropSummary = await prisma.cropBatch.groupBy({
    by: ['cropType', 'variety'],
    _sum: {
      quantity: true
    },
    _count: {
      id: true
    },
    _avg: {
      quantity: true
    },
    where: {
      status: {
        in: ['PROCESSED', 'SHIPPED', 'RECEIVED', 'STORED']
      }
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    }
  });

  // Get warehouse-wise distribution
  const warehouseDistribution = await prisma.cropBatch.groupBy({
    by: ['warehouseId'],
    _sum: {
      quantity: true
    },
    _count: {
      id: true
    },
    where: {
      status: {
        in: ['PROCESSED', 'SHIPPED', 'RECEIVED', 'STORED']
      },
      warehouseId: {
        not: null
      }
    }
  });

  // Get warehouse details for distribution
  const warehouses = await prisma.warehouse.findMany({
    where: {
      id: {
        in: warehouseDistribution.map(w => w.warehouseId).filter(Boolean) as string[]
      }
    },
    select: {
      id: true,
      name: true,
      address: true,
      capacity: true
    }
  });

  const warehouseStats = warehouseDistribution.map(dist => {
    const warehouse = warehouses.find(w => w.id === dist.warehouseId);
    return {
      ...dist,
      warehouse: warehouse 
        ? { 
            name: warehouse.name, 
            location: warehouse.address || 'Unknown', 
            capacity: warehouse.capacity || 0 
          }
        : { name: 'Unknown', location: 'Unknown', capacity: 0 }
    };
  });

  // Get status distribution
  const statusDistribution = await prisma.cropBatch.groupBy({
    by: ['status'],
    _sum: {
      quantity: true
    },
    _count: {
      id: true
    }
  });

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivity = await prisma.cropBatch.findMany({
    where: {
      updatedAt: {
        gte: thirtyDaysAgo
      }
    },
    include: {
      farm: {
        select: {
          name: true
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
    take: 10
  });

  const dbRequirements = await getStockRequirementsFromDb();
  const totalsByCrop = inventoryData.reduce((acc, item) => {
    if (item.status === 'SHIPPED') {
      return acc;
    }
    acc[item.cropType] = (acc[item.cropType] || 0) + (item.quantity || 0);
    return acc;
  }, {} as Record<string, number>);

  const stockAlerts = dbRequirements
    .map((req) => {
      const currentStock = totalsByCrop[req.cropType] || 0;
      return {
        cropType: req.cropType,
        minStock: req.minStock,
        targetQuantity: req.targetQuantity || 0,
        unit: req.unit || 'kg',
        currentStock,
      };
    })
    .filter((alert) => alert.minStock > 0 && alert.currentStock < alert.minStock);

  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 2);
  threeMonthsAgo.setDate(1);

  const monthlyTrends = await prisma.$queryRaw<Array<{ month: string; totalQuantity: number }>>`
    SELECT TO_CHAR(DATE_TRUNC('month', "updatedAt"), 'Mon YYYY') as "month",
           COALESCE(SUM("quantity"), 0)::float as "totalQuantity"
    FROM "public"."CropBatch"
    WHERE "updatedAt" >= ${threeMonthsAgo}
      AND "status" IN ('PROCESSED', 'SHIPPED', 'RECEIVED', 'STORED')
    GROUP BY DATE_TRUNC('month', "updatedAt")
    ORDER BY DATE_TRUNC('month', "updatedAt") ASC
  `;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Inventory Monitor Client Component */}
      <InventoryMonitorClient 
        inventoryData={inventoryData}
        cropSummary={cropSummary}
        warehouseStats={warehouseStats}
        statusDistribution={statusDistribution}
        recentActivity={recentActivity}
        stockAlerts={stockAlerts}
        monthlyTrends={monthlyTrends}
      />
    </div>
  );
}