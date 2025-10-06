"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Warehouse as WarehouseIcon,
} from "lucide-react";
import {
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  toggleWarehouseStatus,
} from "@/app/admin/warehouses/actions";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Warehouse } from "./warehouse-management";

interface WarehouseManagementClientProps {
  initialWarehouses: Warehouse[];
}

export function WarehouseManagementClient({
  initialWarehouses,
}: WarehouseManagementClientProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  // Filter warehouses based on search term
  const filteredWarehouses = warehouses.filter(
    (warehouse) =>
      warehouse.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      warehouse.country?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateWarehouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await createWarehouse(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Warehouse created successfully");
        setShowCreateForm(false);
        
        // Add the new warehouse to local state instead of refreshing
        if (result.warehouse) {
          setWarehouses(prevWarehouses => [...prevWarehouses, result.warehouse]);
        }
      }
    });
  };

  const handleEditWarehouse = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!editingWarehouse) return;

    startTransition(async () => {
      const result = await updateWarehouse(editingWarehouse.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Warehouse updated successfully");
        setEditingWarehouse(null);
        
        // Update the warehouse in local state instead of refreshing
        if (result.warehouse) {
          setWarehouses(prevWarehouses => 
            prevWarehouses.map(w => w.id === editingWarehouse.id ? result.warehouse : w)
          );
        }
      }
    });
  };

  const handleDeleteWarehouse = async (warehouseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this warehouse? This action cannot be undone."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteWarehouse(warehouseId);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message || "Warehouse deleted successfully");
        
        // Remove the warehouse from local state instead of refreshing
        setWarehouses(prevWarehouses => 
          prevWarehouses.filter(w => w.id !== warehouseId)
        );
      }
    });
  };

  const handleToggleWarehouseStatus = async (
    warehouseId: string,
    isActive: boolean
  ) => {
    startTransition(async () => {
      const result = await toggleWarehouseStatus(warehouseId, isActive);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          result.message ||
            `Warehouse ${isActive ? "activated" : "deactivated"} successfully`
        );
        
        // Update the warehouse status in local state instead of refreshing
        setWarehouses(prevWarehouses => 
          prevWarehouses.map(w => 
            w.id === warehouseId ? { ...w, isActive } : w
          )
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Warehouses</CardTitle>
              <CardDescription>
                Manage warehouse locations and storage facilities
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              disabled={isPending}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Create/Edit Warehouse Form */}
          {(showCreateForm || editingWarehouse) && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {editingWarehouse ? "Edit Warehouse" : "Create New Warehouse"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={
                    editingWarehouse
                      ? handleEditWarehouse
                      : handleCreateWarehouse
                  }
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Warehouse Name</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        placeholder="Main Warehouse"
                        defaultValue={editingWarehouse?.name || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="code">Warehouse Code</Label>
                      <Input
                        id="code"
                        name="code"
                        required
                        placeholder="WH001"
                        defaultValue={editingWarehouse?.code || ""}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      placeholder="123 Storage Street"
                      defaultValue={editingWarehouse?.address || ""}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="New York"
                        defaultValue={editingWarehouse?.city || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        name="country"
                        placeholder="USA"
                        defaultValue={editingWarehouse?.country || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="capacity">Capacity (sq ft)</Label>
                      <Input
                        id="capacity"
                        name="capacity"
                        type="number"
                        placeholder="10000"
                        defaultValue={editingWarehouse?.capacity || ""}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isPending}>
                      {isPending
                        ? "Saving..."
                        : editingWarehouse
                        ? "Update Warehouse"
                        : "Create Warehouse"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateForm(false);
                        setEditingWarehouse(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search warehouses by name, code, city, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Warehouses Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWarehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-muted-foreground">
                          {warehouses.length === 0
                            ? "No warehouses available. This could be due to database connectivity issues or no warehouses have been created yet."
                            : "No warehouses match your current search criteria."}
                        </div>
                        {warehouses.length === 0 && (
                          <div className="text-sm text-muted-foreground">
                            Create your first warehouse using the "Add
                            Warehouse" button above.
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWarehouses.map((warehouse) => (
                    <TableRow key={warehouse.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <WarehouseIcon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{warehouse.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Code: {warehouse.code}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          {warehouse.address && (
                            <div className="text-sm">{warehouse.address}</div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {[warehouse.city, warehouse.country]
                              .filter(Boolean)
                              .join(", ") || "No location set"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {warehouse.capacity
                          ? `${warehouse.capacity.toLocaleString()} sq ft`
                          : "Not specified"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={warehouse.isActive ? "success" : "secondary"}
                        >
                          {warehouse.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(warehouse.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingWarehouse(warehouse)}
                            disabled={isPending}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleToggleWarehouseStatus(
                                warehouse.id,
                                !warehouse.isActive
                              )
                            }
                            disabled={isPending}
                          >
                            {warehouse.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWarehouse(warehouse.id)}
                            disabled={isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
