"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { 
  Search, 
  Filter,
  Archive,
  Package,
  Calendar,
  MapPin,
  Eye,
  CheckCircle
} from "lucide-react";
import { toast } from "sonner";

interface CropBatch {
  id: string;
  batchCode: string;
  cropType: string;
  quantity: number | null;
  status: string;
  actualHarvest: Date | null;
  updatedAt: Date;
  farm: {
    name: string;
    location: string | null;
  };
}

interface Stats {
  received: number;
  stored: number;
  totalQuantity: number;
}

interface StorageManagementClientProps {
  batches: CropBatch[];
  stats: Stats;
}

export function StorageManagementClient({ batches, stats }: StorageManagementClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBatch, setSelectedBatch] = useState<CropBatch | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      RECEIVED: { label: "Received", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
      STORED: { label: "Stored", className: "bg-green-100 text-green-800 hover:bg-green-100" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, className: "bg-gray-100 text-gray-800 hover:bg-gray-100" };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.cropType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStoreConfirmation = async (batchId: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/warehouse/storage/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId,
          status: 'STORED',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update storage status');
      }

      toast.success('Batch successfully marked as stored');
      
      // Refresh the page to get updated data
      window.location.reload();
    } catch (error) {
      console.error('Error updating storage status:', error);
      toast.error('Failed to update storage status');
    } finally {
      setIsUpdating(false);
      setSelectedBatch(null);
    }
  };

  if (batches.length === 0) {
    return (
      <div className="text-center py-12">
        <Archive className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No batches for storage</h3>
        <p className="text-gray-500">
          Received crop batches will appear here for storage verification.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by batch code, farm, or crop type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
            <SelectItem value="STORED">Stored</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Batches List */}
      <div className="space-y-4">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="border rounded-lg p-6 hover:shadow-sm transition-shadow">
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center space-x-3 mb-1">
                  <h3 className="font-semibold text-lg">{batch.batchCode}</h3>
                  {getStatusBadge(batch.status)}
                </div>
                <p className="text-muted-foreground">
                  {batch.cropType} • {batch.farm.name} • {batch.quantity || 0}kg
                </p>
              </div>
            </div>

            {/* Batch Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-sm mb-4">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center text-muted-foreground">
                  <Package className="h-4 w-4 mr-1" />
                  <span>Crop Type</span>
                </div>
                <div className="font-medium truncate">{batch.cropType}</div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Harvest Date</span>
                </div>
                <div className="font-medium truncate">
                  {batch.actualHarvest ? format(new Date(batch.actualHarvest), "PPP") : "N/A"}
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center text-muted-foreground">
                  <span>Quantity</span>
                </div>
                <div className="font-medium truncate">{batch.quantity || 0}kg</div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center text-muted-foreground">
                  <span>Last Updated</span>
                </div>
                <div className="font-medium truncate">
                  {format(new Date(batch.updatedAt), "PPp")}
                </div>
              </div>
            </div>

            {/* Farm Location */}
            <div className="mb-4">
              <div className="text-sm flex items-start">
                <MapPin className="h-4 w-4 mr-1 mt-0.5 text-muted-foreground flex-shrink-0" />
                <div>
                  <span className="font-medium text-muted-foreground">Farm Location:</span>
                  <span className="ml-2">{batch.farm.location || "Location not specified"}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Storage Details - {batch.batchCode}</DialogTitle>
                    <DialogDescription>
                      Complete information for this crop batch
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Batch Code</label>
                        <p className="text-sm text-muted-foreground">{batch.batchCode}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <div className="mt-1">{getStatusBadge(batch.status)}</div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Crop Type</label>
                        <p className="text-sm text-muted-foreground">{batch.cropType}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Quantity</label>
                        <p className="text-sm text-muted-foreground">{batch.quantity || 0}kg</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Farm</label>
                        <p className="text-sm text-muted-foreground">{batch.farm.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Harvest Date</label>
                        <p className="text-sm text-muted-foreground">
                          {batch.actualHarvest ? format(new Date(batch.actualHarvest), "PPP") : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Farm Location</label>
                      <p className="text-sm text-muted-foreground">{batch.farm.location || "Not specified"}</p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {batch.status === "RECEIVED" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm"
                      onClick={() => setSelectedBatch(batch)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Mark as Stored
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Storage</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to mark batch {batch.batchCode} as stored? 
                        This confirms that the batch has been properly verified and placed in warehouse storage.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-green-800">Storage Verification Checklist</p>
                          <ul className="text-xs text-green-700 mt-1 space-y-1">
                            <li>• Physical batch matches documentation</li>
                            <li>• Quality inspection completed</li>
                            <li>• Proper storage location assigned</li>
                            <li>• Inventory system updated</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => setSelectedBatch(null)}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleStoreConfirmation(batch.id)}
                        disabled={isUpdating}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isUpdating ? "Updating..." : "Confirm Storage"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {batch.status === "STORED" && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Stored
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredBatches.length === 0 && batches.length > 0 && (
        <div className="text-center py-12">
          <Filter className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No batches match your filters</h3>
          <p className="text-gray-500">
            Try adjusting your search terms or filters to see more results.
          </p>
        </div>
      )}
    </div>
  );
}