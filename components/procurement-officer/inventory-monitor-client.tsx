"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Package,
  Warehouse,
  TrendingUp,
  Search,
  Filter,
  BarChart3,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface CropBatch {
  id: string;
  batchCode: string;
  cropType: string;
  variety: string | null;
  quantity: number | null;
  unit: string | null;
  status: string;
  actualHarvest: Date | null;
  updatedAt: Date;
  farm: {
    name: string;
    location: string | null;
  };
  farmer: {
    name: string;
  };
  warehouse: {
    name: string;
    address: string | null;
  } | null;
}

interface CropSummary {
  cropType: string;
  variety: string | null;
  _sum: {
    quantity: number | null;
  } | undefined;
  _count: {
    id: number;
  };
  _avg: {
    quantity: number | null;
  } | undefined;
}

interface WarehouseStat {
  warehouseId: string | null;
  _sum: {
    quantity: number | null;
  } | undefined;
  _count: {
    id: number;
  };
  warehouse: {
    name: string;
    location: string;
    capacity: number;
  };
}

interface StatusDistribution {
  status: string;
  _sum: {
    quantity: number | null;
  } | undefined;
  _count: {
    id: number;
  };
}

interface RecentActivity {
  id: string;
  batchCode: string;
  cropType: string;
  status: string;
  quantity: number | null;
  unit: string | null;
  updatedAt: Date;
  farm: {
    name: string;
  };
  farmer: {
    name: string;
  };
}

interface InventoryMonitorClientProps {
  inventoryData: CropBatch[];
  cropSummary: CropSummary[];
  warehouseStats: WarehouseStat[];
  statusDistribution: StatusDistribution[];
  recentActivity: RecentActivity[];
}

export function InventoryMonitorClient({
  inventoryData,
  cropSummary,
  warehouseStats,
  statusDistribution,
  recentActivity
}: InventoryMonitorClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCropType, setSelectedCropType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  // Filter inventory data
  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = item.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.farm.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCropType = selectedCropType === "all" || item.cropType === selectedCropType;
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
    const matchesWarehouse = selectedWarehouse === "all" || item.warehouse?.name === selectedWarehouse;

    return matchesSearch && matchesCropType && matchesStatus && matchesWarehouse;
  });

  // Get unique values for filters
  const uniqueCropTypes = [...new Set(inventoryData.map(item => item.cropType))];
  const uniqueStatuses = [...new Set(inventoryData.map(item => item.status))];
  const uniqueWarehouses = [...new Set(inventoryData.map(item => item.warehouse?.name).filter(Boolean))] as string[];

  // Calculate totals
  const totalQuantity = inventoryData.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalBatches = inventoryData.length;
  const averageBatchSize = totalBatches > 0 ? Math.round(totalQuantity / totalBatches) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'STORED':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'QUALITY_CHECKED':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PROCESSED':
        return <CheckCircle className="h-4 w-4" />;
      case 'STORED':
        return <Package className="h-4 w-4" />;
      case 'QUALITY_CHECKED':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              kg across all crops
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <BarChart3 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBatches}</div>
            <p className="text-xs text-muted-foreground">
              Available batches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crop Types</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCropTypes.length}</div>
            <p className="text-xs text-muted-foreground">
              Different crop types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Batch Size</CardTitle>
            <Package className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageBatchSize}</div>
            <p className="text-xs text-muted-foreground">
              kg per batch
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Crop Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            Crop-wise Inventory Summary
          </CardTitle>
          <CardDescription>
            Stock levels by crop type and variety
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cropSummary.map((crop, index) => (
              <div
                key={`${crop.cropType}-${crop.variety || 'no-variety'}-${index}`}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <div className="font-medium">{crop.cropType}</div>
                    {crop.variety && (
                      <div className="text-sm text-muted-foreground">
                        Variety: {crop.variety}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="text-sm font-medium">
                      Total: {crop._sum?.quantity?.toLocaleString() || 0} kg
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {crop._count.id} batches
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="text-sm font-medium">
                      Avg: {Math.round(crop._avg?.quantity || 0)} kg
                    </div>
                    <div className="text-sm text-muted-foreground">
                      per batch
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, ((crop._sum?.quantity || 0) / totalQuantity) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {((crop._sum?.quantity || 0) / totalQuantity * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Inventory Details
          </CardTitle>
          <CardDescription>
            Search and filter inventory items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by batch code, crop type, or farm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={selectedCropType} onValueChange={setSelectedCropType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Crop Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Crop Types</SelectItem>
                {uniqueCropTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {uniqueWarehouses.map(warehouse => (
                  <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Inventory Items */}
          <div className="space-y-4">
            {filteredInventory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No inventory items found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              filteredInventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="font-medium">{item.batchCode}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.cropType} {item.variety && `(${item.variety})`}
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">
                        {item.quantity || 0} {item.unit || 'kg'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        From: {item.farm.name}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="text-sm font-medium flex items-center">
                        <Warehouse className="h-4 w-4 mr-1" />
                        {item.warehouse?.name || 'Not assigned'}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {item.warehouse?.address || 'No location'}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="text-sm font-medium flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {item.actualHarvest ? format(new Date(item.actualHarvest), "PPP") : "No date"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Updated: {format(new Date(item.updatedAt), "PP")}
                      </div>
                    </div>
                  </div>
                  
                  <Badge
                    variant="outline"
                    className={getStatusColor(item.status)}
                  >
                    {getStatusIcon(item.status)}
                    <span className="ml-1">{item.status}</span>
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest inventory changes in the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No recent activity</p>
              </div>
            ) : (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="font-medium">{activity.batchCode}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.cropType} • {activity.quantity || 0} {activity.unit || 'kg'}
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <div className="text-sm font-medium">{activity.farm.name}</div>
                      <div className="text-sm text-muted-foreground">
                        By: {activity.farmer.name}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={getStatusColor(activity.status)}
                    >
                      {getStatusIcon(activity.status)}
                      <span className="ml-1">{activity.status}</span>
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(activity.updatedAt), "PP")}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}