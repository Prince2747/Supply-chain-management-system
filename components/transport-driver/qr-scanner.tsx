"use client";

import { useState, useEffect, useRef } from "react";
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
import { confirmPickup, confirmDelivery, getAssignedTasks } from "@/app/[locale]/dashboard/transport-driver/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

interface QRScannerProps {
  taskId?: string;
  action?: "pickup" | "delivery";
}

export function QRScanner({ taskId, action }: QRScannerProps) {
  const t = useTranslations("transportDriver.scanner");
  const locale = useLocale();
  const [qrCode, setQrCode] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [isManualInput, setIsManualInput] = useState(true); // Start with manual input since camera may not be available
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState(taskId || "");
  const [selectedAction, setSelectedAction] = useState<"pickup" | "delivery" | "">(action || "");
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    if (!isManualInput) {
      startScanner();
    } else {
      stopScanner();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManualInput]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopScanner = () => {
    try {
      scannerControlsRef.current?.stop();
    } catch {
      // ignore
    } finally {
      scannerControlsRef.current = null;
    }
  };

  const startScanner = async () => {
    if (!videoRef.current) return;
    if (scannerControlsRef.current) return;

    hasScannedRef.current = false;

    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();

      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (!result) return;
          if (hasScannedRef.current) return;
          hasScannedRef.current = true;

          const text = result.getText?.() ?? String(result);
          setQrCode(text);

          // Stop scanning to prevent duplicate reads, then switch to manual so user can confirm.
          stopScanner();
          setIsManualInput(true);

          toast.success(t("qrDetected"), {
            description: t("qrDetectedDesc"),
          });
        }
      );

      scannerControlsRef.current = controls;
    } catch (error) {
      console.error("Error starting QR scanner:", error);
      toast.error(t("cameraPermissionError"));
      setIsManualInput(true);
      stopScanner();
    }
  };

  const loadTasks = async () => {
    try {
      const assignedTasks = await getAssignedTasks();
      setTasks(assignedTasks);
    } catch (error) {
      toast.error(t("loadTasksFailed"));
    }
  };

  const handleConfirm = async () => {
    if (!qrCode.trim()) {
      toast.error(t("errorQRCode"));
      return;
    }

    if (!selectedTaskId) {
      toast.error(t("errorSelectTask"));
      return;
    }

    if (!selectedAction) {
      toast.error(t("errorSelectAction"));
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
            ? t("pickupConfirmed")
            : t("deliveryConfirmed")
        );
        router.push(`/${locale}/dashboard/transport-driver`);
      } else {
        toast.error(result.error || t("confirmFailed"));
      }
    } catch (error) {
      toast.error(t("errorOccurred"));
    }

    setLoading(false);
  };

  const selectedTask = tasks.find(task => task.id === selectedTaskId);

  return (
    <div className="space-y-6">
      <Link href={`/${locale}/dashboard/transport-driver`}>
        <Button variant="outline" size="sm" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t("backToDashboard")}
        </Button>
      </Link>

      {/* Task Selection (if not pre-selected) */}
      {!taskId && (
        <Card>
          <CardHeader>
            <CardTitle>{t("selectTask")}</CardTitle>
            <CardDescription>{t("selectTaskDesc")}</CardDescription>
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
            <CardTitle>{t("selectAction")}</CardTitle>
            <CardDescription>{t("selectActionDesc")}</CardDescription>
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
                {t("confirmPickup")}
              </Button>
              <Button
                variant={selectedAction === "delivery" ? "default" : "outline"}
                onClick={() => setSelectedAction("delivery")}
                disabled={selectedTask.status !== "IN_TRANSIT"}
                className="h-20 flex-col"
              >
                <CheckCircle className="h-6 w-6 mb-2" />
                {t("confirmDelivery")}
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
                {t("scanQRTitle", { action: selectedAction === "pickup" ? t("confirmPickup") : t("confirmDelivery") })}
              </span>
            </CardTitle>
            <CardDescription>
              {t("scanQRDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Task Info */}
            {selectedTask && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{t("task")}:</strong> {selectedTask.cropBatch.batchCode} - {selectedTask.cropBatch.farm.name}
                  <br />
                  <strong>{t("expectedQRCode")}:</strong> {selectedTask.cropBatch.batchCode}
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
                {t("cameraScan")}
              </Button>
              <Button
                variant={isManualInput ? "default" : "outline"}
                onClick={() => {
                  setIsManualInput(true);
                  stopScanner();
                }}
                size="sm"
              >
                <Type className="h-4 w-4 mr-2" />
                {t("manualInput")}
              </Button>
            </div>

            {/* Camera Scanner */}
            {!isManualInput && (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-gray-300">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-white/80 rounded-lg" />
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsManualInput(true);
                    stopScanner();
                  }}
                  className="w-full"
                >
                  {t("switchToManual")}
                </Button>
              </div>
            )}

            {/* Manual Input */}
            {isManualInput && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="qrCode">{t("qrCodeLabel")}</Label>
                  <Input
                    id="qrCode"
                    value={qrCode}
                    onChange={(e) => setQrCode(e.target.value)}
                    placeholder={t("qrCodePlaceholder")}
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">{t("notesLabel")}</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("notesPlaceholder")}
                    rows={3}
                  />
                </div>

                <Button 
                  onClick={handleConfirm} 
                  disabled={loading || !qrCode.trim()}
                  className="w-full"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedAction === "pickup" ? t("confirmPickupButton") : t("confirmDeliveryButton")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>{t("instructions")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>{t("instructionPickup")}</p>
            <p>{t("instructionDelivery")}</p>
            <p>{t("instructionMatch")}</p>
            <p>{t("instructionNotes")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
