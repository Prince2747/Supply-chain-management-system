"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  QrCode, 
  Camera, 
  Type, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { confirmPickup, confirmDelivery, getAssignedTasks } from "@/app/dashboard/transport-driver/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface QRScannerProps {
  taskId?: string;
  action?: "pickup" | "delivery";
}

export function QRScanner({ taskId, action }: QRScannerProps) {
  const [qrCode, setQrCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isManualInput, setIsManualInput] = useState(true); // Start with manual input since camera may not be available
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState(taskId || "");
  const [selectedAction, setSelectedAction] = useState<"pickup" | "delivery" | "">(action || "");
  const router = useRouter();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const assignedTasks = await getAssignedTasks();
      setTasks(assignedTasks);
    } catch (error) {
      toast.error("Failed to load tasks");
    }
  };

  const handleConfirm = async () => {
    if (!qrCode.trim()) {
      toast.error("Please enter or scan a QR code");
      return;
    }

    if (!selectedTaskId) {
      toast.error("Please select a task");
      return;
    }

    if (!selectedAction) {
      toast.error("Please select an action (pickup or delivery)");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("qrCode", qrCode.trim());
    formData.append("notes", notes.trim());

    try {
      const result = selectedAction === "pickup" 
        ? await confirmPickup(selectedTaskId, formData)
        : await confirmDelivery(selectedTaskId, formData);

      if (result.success) {
        toast.success(
          selectedAction === "pickup" 
            ? "Pickup confirmed successfully!" 
            : "Delivery confirmed successfully!"
        );
        router.push("/dashboard/transport-driver");
      } else {
        toast.error(result.error || "Failed to confirm action");
      }
    } catch (error) {
      toast.error("An error occurred");
    }

    setLoading(false);
  };

  const selectedTask = tasks.find(task => task.id === selectedTaskId);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/transport-driver">
        <Button variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </Link>

      {/* Task Selection (if not pre-selected) */}
      {!taskId && (
        <Card>
          <CardHeader>
            <CardTitle>Select Task</CardTitle>
            <CardDescription>Choose the transport task you want to update</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTaskId === task.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{task.cropBatch.batchCode}</h3>
                      <p className="text-sm text-muted-foreground">
                        {task.cropBatch.farm.name} • {task.vehicle.plateNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {task.pickupLocation} → {task.deliveryLocation}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === "SCHEDULED" 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {task.status.toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Selection (if not pre-selected) */}
      {!action && selectedTask && (
        <Card>
          <CardHeader>
            <CardTitle>Select Action</CardTitle>
            <CardDescription>What would you like to do?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={selectedAction === "pickup" ? "default" : "outline"}
                onClick={() => setSelectedAction("pickup")}
                disabled={selectedTask.status !== "SCHEDULED"}
                className="h-20 flex-col"
              >
                <QrCode className="h-6 w-6 mb-2" />
                Confirm Pickup
              </Button>
              <Button
                variant={selectedAction === "delivery" ? "default" : "outline"}
                onClick={() => setSelectedAction("delivery")}
                disabled={selectedTask.status !== "IN_TRANSIT"}
                className="h-20 flex-col"
              >
                <CheckCircle className="h-6 w-6 mb-2" />
                Confirm Delivery
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* QR Code Scanner/Input */}
      {selectedTaskId && selectedAction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="h-5 w-5" />
              <span>
                {selectedAction === "pickup" ? "Confirm Pickup" : "Confirm Delivery"}
              </span>
            </CardTitle>
            <CardDescription>
              Scan the QR code on the batch or enter it manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Task Info */}
            {selectedTask && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Task:</strong> {selectedTask.cropBatch.batchCode} - {selectedTask.cropBatch.farm.name}
                  <br />
                  <strong>Expected QR Code:</strong> {selectedTask.cropBatch.batchCode}
                </AlertDescription>
              </Alert>
            )}

            {/* Scanner Mode Toggle */}
            <div className="flex space-x-2">
              <Button
                variant={isManualInput ? "outline" : "default"}
                onClick={() => setIsManualInput(false)}
                size="sm"
              >
                <Camera className="h-4 w-4 mr-2" />
                Camera Scan
              </Button>
              <Button
                variant={isManualInput ? "default" : "outline"}
                onClick={() => setIsManualInput(true)}
                size="sm"
              >
                <Type className="h-4 w-4 mr-2" />
                Manual Input
              </Button>
            </div>

            {/* Camera Scanner (placeholder - would need a QR scanning library) */}
            {!isManualInput && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Camera className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Camera scanning would be implemented here</p>
                <p className="text-sm text-gray-400 mt-2">
                  For now, please use manual input below
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsManualInput(true)}
                  className="mt-4"
                >
                  Switch to Manual Input
                </Button>
              </div>
            )}

            {/* Manual Input */}
            {isManualInput && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="qrCode">QR Code / Batch Code</Label>
                  <Input
                    id="qrCode"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder="Enter the QR code or batch code"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any additional notes..."
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleConfirm} 
                  disabled={loading || !qrCode.trim()}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedAction === "pickup" ? "Confirm Pickup" : "Confirm Delivery"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• For pickup: Scan the QR code at the pickup location to confirm you've collected the batch</p>
            <p>• For delivery: Scan the QR code at the delivery location to confirm successful delivery</p>
            <p>• Make sure the QR code matches the expected batch code for the selected task</p>
            <p>• Add notes if there are any special circumstances or issues</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
