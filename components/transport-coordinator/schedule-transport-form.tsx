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
import { CalendarIcon, Loader2, MapPin, Truck, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createTransportSchedule } from "@/app/[locale]/dashboard/transport-coordinator/actions";
import { toast } from "sonner";

interface CropBatch {
  id: string;
  batchCode: string;
  quantity: number | null;
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
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span>{batch.batchCode} - {batch.farm.name} ({batch.quantity || 0}kg)</span>
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
          <p className="text-xs text-muted-foreground">
            📍 Farm Location: {selectedCropBatch.farm.location}
          </p>
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
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">
            {cropBatches.length === 0 && "No crop batches available for transport. "}
            {drivers.length === 0 && "No drivers available. "}
            {vehicles.length === 0 && "No vehicles available. "}
          </p>
          <p className="text-xs mt-1">
            Please ensure resources are available before scheduling.
          </p>
        </div>
      )}
    </form>
  );
}