"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Calendar, MapPin, Truck, User, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  cancelTransportTask,
  updateScheduledTransportTask,
} from "@/app/[locale]/dashboard/transport-coordinator/actions";

interface Task {
  id: string;
  status: string;
  scheduledDate: Date;
  pickupLocation: string;
  deliveryLocation: string;
  notes?: string | null;
  cropBatch: {
    batchCode: string;
    quantity: number | null;
    farm: {
      name: string;
    };
  };
  driver: {
    name: string;
  };
  vehicle: {
    plateNumber: string;
    type: string;
  };
}

interface PendingSchedulesProps {
  tasks: Task[];
}

export function PendingSchedules({ tasks }: PendingSchedulesProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editScheduledDate, setEditScheduledDate] = useState("");
  const [editPickupLocation, setEditPickupLocation] = useState("");
  const [editDeliveryLocation, setEditDeliveryLocation] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const formatDateForInput = (date: Date) => {
    const value = new Date(date);
    const pad = (input: number) => String(input).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const handleEditSchedule = (task: Task) => {
    setSelectedTask(task);
    setEditScheduledDate(formatDateForInput(task.scheduledDate));
    setEditPickupLocation(task.pickupLocation || "");
    setEditDeliveryLocation(task.deliveryLocation || "");
    setEditNotes(task.notes || "");
    setIsEditOpen(true);
  };

  const handleSaveSchedule = () => {
    if (!selectedTask) return;

    startTransition(async () => {
      const result = await updateScheduledTransportTask(selectedTask.id, {
        scheduledDate: editScheduledDate,
        pickupLocation: editPickupLocation,
        deliveryLocation: editDeliveryLocation,
        notes: editNotes,
      });

      if (!result.success) {
        toast.error(result.error || "Failed to update schedule");
        return;
      }

      toast.success("Schedule updated successfully");
      setIsEditOpen(false);
      router.refresh();
    });
  };

  const handleCancelTask = (task: Task) => {
    const confirmed = window.confirm("Cancel this transport task?");
    if (!confirmed) return;

    startTransition(async () => {
      const result = await cancelTransportTask(task.id, "Cancelled by coordinator");
      if (!result.success) {
        toast.error(result.error || "Failed to cancel task");
        return;
      }

      toast.success("Transport task cancelled");
      router.refresh();
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-sm">No pending transport tasks</p>
        <p className="text-xs">Scheduled tasks will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium">{task.cropBatch.batchCode}</h4>
              <p className="text-sm text-muted-foreground">
                {task.cropBatch.farm.name} • {task.cropBatch.quantity || 0}kg
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {task.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => handleEditSchedule(task)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    Edit Schedule
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleViewDetails(task)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={() => handleCancelTask(task)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    Cancel Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Schedule Info */}
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Scheduled: {format(new Date(task.scheduledDate), "PPP")}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Driver: {task.driver.name}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Vehicle: {task.vehicle.plateNumber} ({task.vehicle.type})</span>
            </div>
          </div>

          {/* Locations */}
          <div className="space-y-2 text-sm">
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-green-700">Pickup:</span>
                <p className="text-muted-foreground">{task.pickupLocation}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <MapPin className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium text-red-700">Delivery:</span>
                <p className="text-muted-foreground">{task.deliveryLocation}</p>
              </div>
            </div>
          </div>

          {/* Notes if any */}
          {task.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Notes:</span> {task.notes}
              </p>
            </div>
          )}
        </div>
      ))}

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transport Task Details</DialogTitle>
            <DialogDescription>Review the scheduled transport details.</DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Batch</div>
                <div className="font-medium">{selectedTask.cropBatch.batchCode}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedTask.cropBatch.farm.name} • {selectedTask.cropBatch.quantity || 0}kg
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Scheduled</div>
                  <div className="font-medium">
                    {format(new Date(selectedTask.scheduledDate), "PPp")}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {selectedTask.status}
                  </Badge>
                </div>
                <div>
                  <div className="text-muted-foreground">Driver</div>
                  <div className="font-medium">{selectedTask.driver.name}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Vehicle</div>
                  <div className="font-medium">
                    {selectedTask.vehicle.plateNumber} ({selectedTask.vehicle.type})
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Pickup</div>
                  <div className="font-medium">{selectedTask.pickupLocation}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Delivery</div>
                  <div className="font-medium">{selectedTask.deliveryLocation}</div>
                </div>
              </div>

              {selectedTask.notes && (
                <div className="text-sm">
                  <div className="text-muted-foreground">Notes</div>
                  <div className="font-medium whitespace-pre-wrap">{selectedTask.notes}</div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
            <DialogDescription>Update the scheduled time and routing details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Scheduled Date</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={editScheduledDate}
                onChange={(event) => setEditScheduledDate(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupLocation">Pickup Location</Label>
              <Input
                id="pickupLocation"
                value={editPickupLocation}
                onChange={(event) => setEditPickupLocation(event.target.value)}
                placeholder="Enter pickup location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryLocation">Delivery Location</Label>
              <Input
                id="deliveryLocation"
                value={editDeliveryLocation}
                onChange={(event) => setEditDeliveryLocation(event.target.value)}
                placeholder="Enter delivery location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                value={editNotes}
                onChange={(event) => setEditNotes(event.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveSchedule} disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}