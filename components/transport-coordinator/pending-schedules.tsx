"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar, MapPin, Truck, User, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
                  <DropdownMenuItem>Edit Schedule</DropdownMenuItem>
                  <DropdownMenuItem>View Details</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
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
    </div>
  );
}