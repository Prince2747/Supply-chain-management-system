"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Camera, 
  CameraOff, 
  Scan, 
  Package,
  User,
  Truck,
  Calendar,
  MapPin,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface BatchDetails {
  id: string;
  batchCode: string;
  cropType: string;
  quantity: number | null;
  status: string;
  harvestDate: Date | null;
  farm: {
    name: string;
    location: string | null;
  };
  transportTask?: {
    id: string;
    driver: {
      name: string;
      phone: string;
    };
    vehicle: {
      plateNumber: string;
      type: string;
    };
    actualDeliveryDate: Date | null;
  };
}

export function QRScannerClient() {
  const [isScanning, setIsScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [batchDetails, setBatchDetails] = useState<BatchDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleScan = async (qrCode: string) => {
    if (!qrCode.trim()) {
      toast.error('Please enter a valid QR code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/warehouse/scanner/verify-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrCode: qrCode.trim() }),
      });

      if (!response.ok) {
        throw new Error('Batch not found or invalid QR code');
      }

      const batch = await response.json();
      setBatchDetails(batch);
      setShowDetails(true);
      setManualCode("");
      stopCamera();
    } catch (error) {
      console.error('Error verifying batch:', error);
      toast.error('Invalid QR code or batch not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!batchDetails) return;

    setIsConfirming(true);
    try {
      const response = await fetch('/api/warehouse/scanner/confirm-receipt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          batchId: batchDetails.id,
          transportTaskId: batchDetails.transportTask?.id 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to confirm receipt');
      }

      toast.success(`Batch ${batchDetails.batchCode} receipt confirmed successfully`);
      setBatchDetails(null);
      setShowDetails(false);
      
      // Refresh the page to update the deliveries list
      window.location.reload();
    } catch (error) {
      console.error('Error confirming receipt:', error);
      toast.error('Failed to confirm batch receipt');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Scanner Area */}
      <div className="relative">
        {isScanning ? (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full aspect-square object-cover rounded-lg border-2 border-dashed border-green-300"
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border-2 border-green-500 rounded-lg bg-transparent"></div>
            </div>
            <Button
              onClick={stopCamera}
              className="absolute top-2 right-2"
              size="sm"
              variant="destructive"
            >
              <CameraOff className="h-4 w-4 mr-2" />
              Stop Camera
            </Button>
          </div>
        ) : (
          <div className="w-full aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <Scan className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Camera not active</p>
              <Button onClick={startCamera} disabled={isLoading}>
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Manual Input */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="h-px bg-gray-300 flex-1"></div>
          <span className="text-sm text-gray-500">OR</span>
          <div className="h-px bg-gray-300 flex-1"></div>
        </div>
        
        <div className="flex space-x-2">
          <Input
            placeholder="Enter QR code manually..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleScan(manualCode)}
            disabled={isLoading}
          />
          <Button 
            onClick={() => handleScan(manualCode)}
            disabled={isLoading || !manualCode.trim()}
          >
            {isLoading ? "Verifying..." : "Scan"}
          </Button>
        </div>
      </div>

      {/* Batch Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2 text-green-500" />
              Batch Receipt Verification
            </DialogTitle>
            <DialogDescription>
              Review the batch details and confirm receipt
            </DialogDescription>
          </DialogHeader>

          {batchDetails && (
            <div className="space-y-6">
              {/* Batch Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{batchDetails.batchCode}</CardTitle>
                  <CardDescription>
                    <Badge 
                      variant={batchDetails.status === "PACKAGED" ? "default" : "outline"}
                      className={batchDetails.status === "PACKAGED" ? "bg-green-100 text-green-800" : ""}
                    >
                      {batchDetails.status.replace('_', ' ')}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Crop Type</label>
                      <p className="text-sm">{batchDetails.cropType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                      <p className="text-sm">{batchDetails.quantity || 0}kg</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Farm</label>
                      <p className="text-sm">{batchDetails.farm.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Harvest Date</label>
                      <p className="text-sm">
                        {batchDetails.harvestDate ? format(new Date(batchDetails.harvestDate), "PPP") : "N/A"}
                      </p>
                    </div>
                  </div>
                  
                  {batchDetails.farm.location && (
                    <div className="mt-4">
                      <label className="text-sm font-medium text-muted-foreground">Farm Location</label>
                      <p className="text-sm flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {batchDetails.farm.location}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Transport Info */}
              {batchDetails.transportTask && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Truck className="h-5 w-5 mr-2 text-blue-500" />
                      Transport Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Driver</label>
                        <p className="text-sm flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {batchDetails.transportTask.driver.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {batchDetails.transportTask.driver.phone}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Vehicle</label>
                        <p className="text-sm flex items-center">
                          <Truck className="h-4 w-4 mr-1" />
                          {batchDetails.transportTask.vehicle.plateNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {batchDetails.transportTask.vehicle.type.replace('_', ' ')}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Delivery Date</label>
                        <p className="text-sm flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {batchDetails.transportTask.actualDeliveryDate 
                            ? format(new Date(batchDetails.transportTask.actualDeliveryDate), "PPp")
                            : "N/A"
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status Check */}
              <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">Batch verified and ready for receipt confirmation</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDetails(false)}
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmReceipt}
              disabled={isConfirming}
              className="bg-green-600 hover:bg-green-700"
            >
              {isConfirming ? "Confirming..." : "Confirm Receipt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}