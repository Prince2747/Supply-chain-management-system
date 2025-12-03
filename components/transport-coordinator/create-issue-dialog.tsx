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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createTransportIssue, getTransportTasks } from "@/app/[locale]/dashboard/transport-coordinator/actions";
import { toast } from "sonner";

export function CreateIssueDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);

  const issueTypes = [
    { value: "VEHICLE_BREAKDOWN", label: "Vehicle Breakdown" },
    { value: "TRAFFIC_DELAY", label: "Traffic Delay" },
    { value: "WEATHER_DELAY", label: "Weather Delay" },
    { value: "DAMAGED_GOODS", label: "Damaged Goods" },
    { value: "ROUTE_CHANGE", label: "Route Change" },
    { value: "OTHER", label: "Other" },
  ];

  const loadTasks = async () => {
    if (tasks.length > 0) return; // Don't reload if already loaded
    
    setTasksLoading(true);
    try {
      const transportTasks = await getTransportTasks();
      // Only show active tasks (scheduled or in transit)
      const activeTasks = transportTasks.filter(task => 
        task.status === "SCHEDULED" || task.status === "IN_TRANSIT"
      );
      setTasks(activeTasks);
    } catch (error) {
      toast.error("Failed to load transport tasks");
    }
    setTasksLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await createTransportIssue(formData);
      
      if (result.success) {
        toast.success("Transport issue created successfully");
        setOpen(false);
        // Reset form
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error || "Failed to create transport issue");
      }
    } catch (error) {
      toast.error("Failed to create transport issue");
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2" onClick={loadTasks}>
          <Plus className="h-4 w-4" />
          <span>Report Issue</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Transport Issue</DialogTitle>
          <DialogDescription>
            Report a new transport issue for tracking and resolution.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transportTaskId">Transport Task</Label>
            <Select name="transportTaskId" required>
              <SelectTrigger>
                <SelectValue placeholder={tasksLoading ? "Loading tasks..." : "Select a transport task"} />
              </SelectTrigger>
              <SelectContent>
                {tasks.length > 0 ? (
                  tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.cropBatch.batchCode} - {task.vehicle.plateNumber} ({task.driver.name})
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground">
                    {tasksLoading ? "Loading tasks..." : "No active transport tasks found"}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueType">Issue Type</Label>
            <Select name="issueType" required>
              <SelectTrigger>
                <SelectValue placeholder="Select issue type" />
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
              className="min-h-[100px]"
            />
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
              Create Issue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
