import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { InventoryMonitorClient } from "@/components/procurement-officer/inventory-monitor-client";

export default async function InventoryMonitorPage() {
  // Get current user authentication
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const currentProfile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true, name: true }
  });

  if (!currentProfile || currentProfile.role !== 'procurement_officer') {
    redirect('/unauthorized');
  }

  // Get detailed inventory data
  const inventoryData = await prisma.cropBatch.findMany({
    where: {
      status: {
        in: ['PROCESSED', 'STORED'] // Available inventory
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
        in: ['PROCESSED', 'STORED']
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
        in: ['PROCESSED', 'STORED']
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Monitor</h1>
        <p className="text-muted-foreground">
          Real-time inventory levels, stock trends, and warehouse distribution
        </p>
      </div>

      {/* Inventory Monitor Client Component */}
      <InventoryMonitorClient 
        inventoryData={inventoryData}
        cropSummary={cropSummary}
        warehouseStats={warehouseStats}
        statusDistribution={statusDistribution}
        recentActivity={recentActivity}
      />
    </div>
  );
}