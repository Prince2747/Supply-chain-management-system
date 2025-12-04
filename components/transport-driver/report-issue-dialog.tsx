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
import { useTranslations } from "next-intl";

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
  const t = useTranslations("transportDriver.reportIssueDialog");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const issueTypes = [
    { value: "VEHICLE_BREAKDOWN", label: t("vehicleBreakdown") },
    { value: "TRAFFIC_DELAY", label: t("trafficDelay") },
    { value: "WEATHER_DELAY", label: t("weatherDelay") },
    { value: "DAMAGED_GOODS", label: t("damagedGoods") },
    { value: "ROUTE_CHANGE", label: t("routeChange") },
    { value: "OTHER", label: t("other") },
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const result = await reportTransportIssue(formData);
      
      if (result.success) {
        toast.success(t("successMessage"));
        setOpen(false);
        // Reset form
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error || t("errorMessage"));
      }
    } catch (error) {
      toast.error(t("errorMessage"));
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
            <span>{t("submit")}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>{t("title")}</span>
          </DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transportTaskId">{t("transportTask")}</Label>
            <Select name="transportTaskId" defaultValue={preSelectedTaskId} required>
              <SelectTrigger>
                <SelectValue placeholder={t("selectTask")} />
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
                    {t("noActiveTasks")}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="issueType">{t("issueType")}</Label>
            <Select name="issueType" required>
              <SelectTrigger>
                <SelectValue placeholder={t("selectIssueType")} />
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
            <Label htmlFor="description">{t("descriptionLabel")}</Label>
            <Textarea
              name="description"
              placeholder={t("descriptionPlaceholder")}
              required
              className="min-h-[120px]"
            />
            <p className="text-xs text-muted-foreground">
              {t("descriptionHint")}
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={loading || tasks.length === 0}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("submit")}
            </Button>
          </div>
        </form>

        {tasks.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            <p>{t("noTasksToReport")}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
