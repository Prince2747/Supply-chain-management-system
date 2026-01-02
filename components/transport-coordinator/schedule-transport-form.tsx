"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2, MapPin, Truck, User, Package } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { createTransportSchedule } from "@/app/[locale]/dashboard/transport-coordinator/actions";
import { toast } from "sonner";

interface CropBatch {
  id: string;
  batchCode: string;
  quantity: number | null;
  status: string;
  cropType: string;
  farm: {
    name: string;
    location: string | null;
  };
}

interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  capacity: number;
}

interface ScheduleTransportFormProps {
  cropBatches: CropBatch[];
  drivers: Driver[];
  vehicles: Vehicle[];
}

export function ScheduleTransportForm({
  cropBatches,
  drivers,
  vehicles,
}: ScheduleTransportFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedCropBatch, setSelectedCropBatch] = useState<CropBatch | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    if (selectedDate) {
      formData.append("scheduledDate", selectedDate.toISOString());
    }

    try {
      const result = await createTransportSchedule(formData);
      
      if (result.success) {
        toast.success("Transport task scheduled successfully");
        // Reset form
        (e.target as HTMLFormElement).reset();
        setSelectedDate(undefined);
        setSelectedCropBatch(null);
      } else {
        toast.error(result.error || "Failed to schedule transport task");
      }
    } catch (error) {
      toast.error("Failed to schedule transport task");
    }
    
    setLoading(false);
  };

  const handleCropBatchChange = (batchId: string) => {
    const batch = cropBatches.find(b => b.id === batchId);
    setSelectedCropBatch(batch || null);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      HARVESTED: 'bg-orange-100 text-orange-800',
      PROCESSED: 'bg-purple-100 text-purple-800',
      READY_FOR_PACKAGING: 'bg-indigo-100 text-indigo-800',
      PACKAGED: 'bg-cyan-100 text-cyan-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Crop Batch Selection */}
      <div className="space-y-2">
        <Label htmlFor="cropBatchId">Crop Batch *</Label>
        <Select name="cropBatchId" onValueChange={handleCropBatchChange} required>
          <SelectTrigger>
            <SelectValue placeholder="Select crop batch to transport" />
          </SelectTrigger>
          <SelectContent>
            {cropBatches.length > 0 ? (
              cropBatches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  <div className="flex items-center justify-between gap-3 w-full">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4" />
                      <span className="font-medium">{batch.batchCode}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-sm">{batch.cropType}</span>
                    </div>
                    <Badge variant="secondary" className={cn("text-xs", getStatusColor(batch.status))}>
                      {getStatusLabel(batch.status)}
                    </Badge>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                No crop batches available for transport
              </div>
            )}
          </SelectContent>
        </Select>
        {selectedCropBatch && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              📍 Farm: {selectedCropBatch.farm.name}
            </p>
            <p className="text-xs text-muted-foreground">
              📦 Quantity: {selectedCropBatch.quantity || 'N/A'} kg
            </p>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span>🏷️ Status:</span>
              <Badge
                variant="secondary"
                className={cn("text-xs", getStatusColor(selectedCropBatch.status))}
              >
                {getStatusLabel(selectedCropBatch.status)}
              </Badge>
            </div>
          </div>
        )}
      </div>

      {/* Driver Selection */}
      <div className="space-y-2">
        <Label htmlFor="driverId">Assign Driver *</Label>
        <Select name="driverId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select driver for transport" />
          </SelectTrigger>
          <SelectContent>
            {drivers.length > 0 ? (
              drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{driver.name} - {driver.licenseNumber}</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                No drivers available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Vehicle Selection */}
      <div className="space-y-2">
        <Label htmlFor="vehicleId">Assign Vehicle *</Label>
        <Select name="vehicleId" required>
          <SelectTrigger>
            <SelectValue placeholder="Select vehicle for transport" />
          </SelectTrigger>
          <SelectContent>
            {vehicles.length > 0 ? (
              vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  <div className="flex items-center space-x-2">
                    <Truck className="h-4 w-4" />
                    <span>{vehicle.plateNumber} - {vehicle.type} (Capacity: {vehicle.capacity}kg)</span>
                  </div>
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-sm text-muted-foreground">
                No vehicles available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Scheduled Date */}
      <div className="space-y-2">
        <Label>Scheduled Date *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Pickup Location */}
      <div className="space-y-2">
        <Label htmlFor="pickupLocation">Pickup Location *</Label>
        <Textarea
          name="pickupLocation"
          placeholder="Enter detailed pickup location address..."
          required
          className="min-h-[80px]"
          defaultValue={selectedCropBatch?.farm.location || ""}
        />
      </div>

      {/* Delivery Location */}
      <div className="space-y-2">
        <Label htmlFor="deliveryLocation">Delivery Location *</Label>
        <Textarea
          name="deliveryLocation"
          placeholder="Enter detailed delivery location address..."
          required
          className="min-h-[80px]"
        />
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          name="notes"
          placeholder="Special instructions, route preferences, handling notes..."
          className="min-h-[80px]"
        />
      </div>

      <Button 
        type="submit" 
        disabled={loading || cropBatches.length === 0 || drivers.length === 0 || vehicles.length === 0}
        className="w-full"
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Schedule Transport Task
      </Button>

      {(cropBatches.length === 0 || drivers.length === 0 || vehicles.length === 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start space-x-3">
            <Package className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-amber-900">
                Resources Required
              </p>
              <div className="text-sm text-amber-700 space-y-1">
                {cropBatches.length === 0 && (
                  <p>• No crop batches available for transport. Waiting for field agents to mark crops as HARVESTED, PROCESSED, or PACKAGED.</p>
                )}
                {drivers.length === 0 && (
                  <p>• No drivers available. Please ensure drivers are set to AVAILABLE status.</p>
                )}
                {vehicles.length === 0 && (
                  <p>• No vehicles available. Please ensure vehicles are set to AVAILABLE status.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}