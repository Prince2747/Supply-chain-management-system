"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Truck, 
  Plus, 
  Settings, 
  AlertCircle, 
  CheckCircle,
  Wrench,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { getVehicles, createVehicle, updateVehicleStatus } from "../actions";

interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  capacity: number;
  status: string;
  createdAt: Date;
  transportTasks: any[];
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (error) {
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (formData: FormData) => {
    try {
      const result = await createVehicle(formData);
      if (result.success) {
        toast.success("Vehicle created successfully");
        setIsDialogOpen(false);
        loadVehicles();
      } else {
        toast.error(result.error || "Failed to create vehicle");
      }
    } catch (error) {
      toast.error("Failed to create vehicle");
    }
  };

  const handleStatusChange = async (vehicleId: string, status: string) => {
    try {
      const result = await updateVehicleStatus(vehicleId, status);
      if (result.success) {
        toast.success("Vehicle status updated");
        loadVehicles();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update vehicle status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return "bg-green-100 text-green-800";
      case "IN_USE":
        return "bg-blue-100 text-blue-800";
      case "MAINTENANCE":
        return "bg-yellow-100 text-yellow-800";
      case "OUT_OF_SERVICE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <CheckCircle className="h-4 w-4" />;
      case "IN_USE":
        return <Truck className="h-4 w-4" />;
      case "MAINTENANCE":
        return <Wrench className="h-4 w-4" />;
      case "OUT_OF_SERVICE":
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeDisplay = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return <div>Loading vehicles...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vehicle Management</h1>
          <p className="text-muted-foreground">
            Manage your fleet of vehicles for transportation tasks
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Vehicle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Vehicle</DialogTitle>
              <DialogDescription>
                Add a new vehicle to your fleet for transport assignments.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateVehicle} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plateNumber">Plate Number</Label>
                <Input
                  id="plateNumber"
                  name="plateNumber"
                  placeholder="ABC-123"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Vehicle Type</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRUCK">Truck</SelectItem>
                    <SelectItem value="VAN">Van</SelectItem>
                    <SelectItem value="PICKUP">Pickup</SelectItem>
                    <SelectItem value="REFRIGERATED_TRUCK">Refrigerated Truck</SelectItem>
                    <SelectItem value="CONTAINER_TRUCK">Container Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity (kg)</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  step="0.01"
                  placeholder="1000"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Add Vehicle</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vehicles Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicles</CardTitle>
          <CardDescription>
            All vehicles in your fleet with their current status and assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Task</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                  <TableCell>{getTypeDisplay(vehicle.type)}</TableCell>
                  <TableCell>{vehicle.capacity.toLocaleString()} kg</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(vehicle.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(vehicle.status)}
                        {vehicle.status.replace('_', ' ')}
                      </span>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {vehicle.transportTasks.length > 0 ? (
                      <span className="text-sm text-muted-foreground">
                        {vehicle.transportTasks[0].cropBatch.batchNumber}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No active task</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={vehicle.status}
                      onValueChange={(status) => handleStatusChange(vehicle.id, status)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="IN_USE">In Use</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="OUT_OF_SERVICE">Out of Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {vehicles.length === 0 && (
            <div className="text-center py-8">
              <Truck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No vehicles</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding your first vehicle.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
