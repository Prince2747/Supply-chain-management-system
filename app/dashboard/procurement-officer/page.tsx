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

export default async function ProcurementOfficerDashboard() {
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

  // Get batch statistics for review
  const pendingBatches = await prisma.cropBatch.count({
    where: { 
      status: "HARVESTED" // Batches ready for procurement review
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
      status: "HARVESTED"
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Procurement Officer Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor inventory, review batches, and manage stock requirements
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingBatches}</div>
            <p className="text-xs text-muted-foreground">
              Batches awaiting review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Batches</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedBatches}</div>
            <p className="text-xs text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{inventoryStats.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Need restocking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inventoryStats.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Items in system
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-green-600" />
              Batch Reviews
            </CardTitle>
            <CardDescription>
              Review and approve crop batches from field agents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-orange-600">{pendingBatches}</div>
              <p className="text-sm text-muted-foreground">Pending reviews</p>
              <Link href="/dashboard/procurement-officer/batch-reviews">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Review Batches
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              Stock Requirements
            </CardTitle>
            <CardDescription>
              Set and update crop stock requirements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">{inventoryStats.lowStock}</div>
              <p className="text-sm text-muted-foreground">Items need attention</p>
              <Link href="/dashboard/procurement-officer/stock-requirements">
                <Button variant="outline" className="w-full">
                  Manage Requirements
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              Transport Assignment
            </CardTitle>
            <CardDescription>
              Assign crop batches to transport coordinators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {transportData?.cropBatches?.length || 0}
              </div>
              <p className="text-sm text-muted-foreground">Ready for transport</p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="#transport-section">
                  Assign Transport
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Batches for Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Recent Batches Awaiting Review
          </CardTitle>
          <CardDescription>
            Latest crop batches submitted by field agents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentBatches.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p>No batches pending review</p>
              <p className="text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentBatches.map((batch) => (
                <div
                  key={batch.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="font-medium">{batch.batchCode}</div>
                      <div className="text-sm text-muted-foreground">
                        {batch.cropType} {batch.variety && `(${batch.variety})`}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">{batch.farm.name}</div>
                      <div className="text-sm text-muted-foreground">
                        By: {batch.farmer.name}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">
                        {batch.quantity} {batch.unit}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {batch.actualHarvest ? format(new Date(batch.actualHarvest), "PPP") : "No harvest date"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-orange-600">
                      Pending Review
                    </Badge>
                    <Link href={`/dashboard/procurement-officer/batch-reviews?batch=${batch.id}`}>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              
              {recentBatches.length >= 5 && (
                <div className="text-center pt-4">
                  <Link href="/dashboard/procurement-officer/batch-reviews">
                    <Button variant="outline">
                      View All Pending Reviews
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