"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Plus,
  Package,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { toast } from "sonner";

interface StockRequirement {
  cropType: string;
  minStock: number;
  unit: string;
  currentStock: number;
  batchCount: number;
  status: 'sufficient' | 'low' | 'no_requirement';
}

interface StockRequirementsClientProps {
  requirements: StockRequirement[];
}

export function StockRequirementsClient({ requirements }: StockRequirementsClientProps) {
  const [stockRequirements, setStockRequirements] = useState<StockRequirement[]>(requirements);
  const [editingRequirement, setEditingRequirement] = useState<StockRequirement | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newMinStock, setNewMinStock] = useState<number>(0);

  const handleEditRequirement = (requirement: StockRequirement) => {
    setEditingRequirement(requirement);
    setNewMinStock(requirement.minStock);
    setIsEditDialogOpen(true);
  };

  const handleSaveRequirement = async () => {
    if (!editingRequirement) return;

    // In a real app, this would call an API
    const updatedRequirements = stockRequirements.map(req =>
      req.cropType === editingRequirement.cropType
        ? {
            ...req,
            minStock: newMinStock,
            status: req.currentStock >= newMinStock ? 'sufficient' as const : 'low' as const
          }
        : req
    );

    setStockRequirements(updatedRequirements);
    setIsEditDialogOpen(false);
    setEditingRequirement(null);
    
    toast.success(`Updated minimum stock requirement for ${editingRequirement.cropType}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sufficient':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'low':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'no_requirement':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sufficient':
        return <CheckCircle className="h-4 w-4" />;
      case 'low':
        return <AlertTriangle className="h-4 w-4" />;
      case 'no_requirement':
        return <Minus className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sufficient':
        return 'Sufficient';
      case 'low':
        return 'Low Stock';
      case 'no_requirement':
        return 'No Requirement';
      default:
        return 'Unknown';
    }
  };

  const getTrendIcon = (requirement: StockRequirement) => {
    if (requirement.status === 'no_requirement') return null;
    
    const percentageOfMin = (requirement.currentStock / requirement.minStock) * 100;
    
    if (percentageOfMin >= 120) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (percentageOfMin < 80) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return null;
  };

  // Summary stats
  const stats = {
    total: stockRequirements.length,
    sufficient: stockRequirements.filter(r => r.status === 'sufficient').length,
    low: stockRequirements.filter(r => r.status === 'low').length,
    noRequirement: stockRequirements.filter(r => r.status === 'no_requirement').length,
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Crops</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Crop types in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sufficient Stock</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.sufficient}</div>
            <p className="text-xs text-muted-foreground">
              Above minimum levels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.low}</div>
            <p className="text-xs text-muted-foreground">
              Below minimum levels
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Requirements</CardTitle>
            <Minus className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{stats.noRequirement}</div>
            <p className="text-xs text-muted-foreground">
              Need requirements set
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requirements Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Requirements</CardTitle>
          <CardDescription>
            Manage minimum stock levels for each crop type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stockRequirements.map((requirement) => (
              <div
                key={requirement.cropType}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <div className="font-medium">{requirement.cropType}</div>
                    <div className="text-sm text-muted-foreground">
                      {requirement.batchCount} batches available
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="text-sm font-medium">
                      Current: {requirement.currentStock} {requirement.unit}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Minimum: {requirement.minStock > 0 ? `${requirement.minStock} ${requirement.unit}` : 'Not set'}
                    </div>
                  </div>

                  {requirement.minStock > 0 && (
                    <div className="flex flex-col items-center">
                      <div className="text-sm font-medium">
                        {Math.round((requirement.currentStock / requirement.minStock) * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        of minimum
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {getTrendIcon(requirement)}
                  
                  <Badge
                    variant="outline"
                    className={getStatusColor(requirement.status)}
                  >
                    {getStatusIcon(requirement.status)}
                    <span className="ml-1">{getStatusText(requirement.status)}</span>
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditRequirement(requirement)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Requirement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stock Requirement</DialogTitle>
            <DialogDescription>
              Set the minimum stock level for {editingRequirement?.cropType}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-stock" className="text-right">
                Current Stock
              </Label>
              <Input
                id="current-stock"
                value={`${editingRequirement?.currentStock || 0} ${editingRequirement?.unit || 'kg'}`}
                className="col-span-3"
                disabled
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min-stock" className="text-right">
                Minimum Stock
              </Label>
              <Input
                id="min-stock"
                type="number"
                value={newMinStock}
                onChange={(e) => setNewMinStock(parseInt(e.target.value) || 0)}
                className="col-span-3"
                placeholder="Enter minimum stock level"
              />
            </div>
            
            {editingRequirement && newMinStock > 0 && (
              <div className="text-sm text-muted-foreground">
                Current stock is {
                  editingRequirement.currentStock >= newMinStock
                    ? <span className="text-green-600 font-medium">sufficient</span>
                    : <span className="text-red-600 font-medium">{((editingRequirement.currentStock / newMinStock) * 100).toFixed(0)}% of minimum</span>
                }
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRequirement} className="bg-green-600 hover:bg-green-700">
              Save Requirement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}