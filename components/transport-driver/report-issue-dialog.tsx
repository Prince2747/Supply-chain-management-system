"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2, Plus } from "lucide-react";
import { reportTransportIssue } from "@/app/[locale]/dashboard/transport-driver/actions";
import { toast } from "sonner";

interface Task {
  id: string;
  status: string;
  cropBatch: {
    batchCode: string;
    farm: {
      name: string;
    };
  };
  vehicle: {
    plateNumber: string;
  };
  pickupLocation: string;
  deliveryLocation: string;
}

interface ReportIssueDialogProps {
  tasks: Task[];
  preSelectedTaskId?: string;
  children?: React.ReactNode;
}

export function ReportIssueDialog({ tasks, preSelectedTaskId, children }: ReportIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const issueTypes = [
    { value: "VEHICLE_BREAKDOWN", label: "Vehicle Breakdown" },
    { value: "TRAFFIC_DELAY", label: "Traffic Delay" },
    { value: "WEATHER_DELAY", label: "Weather Delay" },
    { value: "DAMAGED_GOODS", label: "Damaged Goods" },
    { value: "ROUTE_CHANGE", label: "Route Change" },
    { value: "OTHER", label: "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await reportTransportIssue(formData);
      
      if (result.success) {
        toast.success("Issue reported successfully");
        setOpen(false);
        // Reset form
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error || "Failed to report issue");
      }
    } catch (error) {
      toast.error("Failed to report issue");
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          children
        ) : (
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Report Issue</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Report Transport Issue</span>
          </DialogTitle>
          <DialogDescription>
            Report any problems or delays with your transport tasks.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transportTaskId">Transport Task</Label>
            <Select name="transportTaskId" defaultValue={preSelectedTaskId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select the affected task" />
              </SelectTrigger>
              <SelectContent>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.cropBatch.batchCode} - {task.vehicle.plateNumber} ({task.status})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    No active tasks available
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueType">Issue Type</Label>
            <Select name="issueType" required>
              <SelectTrigger>
                <SelectValue placeholder="Select the type of issue" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              name="description"
              placeholder="Describe the issue in detail..."
              required
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              Please provide as much detail as possible to help coordinators resolve the issue quickly.
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || tasks.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Report Issue
            </Button>
          </div>
        </form>

        {tasks.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p>No active transport tasks to report issues for.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
