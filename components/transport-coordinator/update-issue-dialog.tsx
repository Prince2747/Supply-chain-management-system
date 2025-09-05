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
import { Edit, Loader2 } from "lucide-react";
import { updateTransportIssue } from "@/app/dashboard/transport-coordinator/actions";
import { toast } from "sonner";

interface Issue {
  id: string;
  issueType: string;
  description: string;
  status: string;
  reportedAt: Date;
  resolvedAt: Date | null;
  resolution: string | null;
}

interface UpdateIssueDialogProps {
  issue: Issue;
}

export function UpdateIssueDialog({ issue }: UpdateIssueDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: "OPEN", label: "Open" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "ESCALATED", label: "Escalated" },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await updateTransportIssue(issue.id, formData);
      
      if (result.success) {
        toast.success("Issue updated successfully");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to update issue");
      }
    } catch (error) {
      toast.error("Failed to update issue");
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center space-x-1">
          <Edit className="h-3 w-3" />
          <span>Update</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Transport Issue</DialogTitle>
          <DialogDescription>
            Update the status and resolution of this transport issue.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Issue Details (Read Only) */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div>
              <Label className="text-sm font-medium text-gray-700">Issue Type</Label>
              <p className="text-sm">
                {issue.issueType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <p className="text-sm text-gray-600">{issue.description}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Reported</Label>
              <p className="text-sm text-gray-600">
                {new Date(issue.reportedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={issue.status} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resolution">Resolution Notes</Label>
              <Textarea
                name="resolution"
                placeholder="Describe the resolution or current progress..."
                defaultValue={issue.resolution || ""}
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
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Issue
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
