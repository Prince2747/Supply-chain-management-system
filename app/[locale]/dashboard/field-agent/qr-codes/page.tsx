"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  QrCode, 
  Download, 
  Search,
  Sprout,
  Building2,
  User,
  Calendar,
  Eye,
  Package
} from "lucide-react";
import { getCropBatches } from "../actions";
import { toast } from "sonner";
import QRCodeLib from "qrcode";

interface CropBatch {
  id: string;
  batchCode: string;
  cropType: string;
  variety: string | null;
  plantingDate: Date | null;
  expectedHarvest: Date | null;
  actualHarvest: Date | null;
  quantity: number | null;
  unit: string | null;
  farmId: string;
  farmerId: string;
  status: string;
  qrCode: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  farmer: {
    name: string;
    farmerId: string;
  };
  farm: {
    name: string;
    farmCode: string;
  };
  _count: {
    notifications: number;
  };
}

const statusColors: Record<string, string> = {
  PLANTED: "bg-blue-100 text-blue-800",
  GROWING: "bg-green-100 text-green-800",
  READY_FOR_HARVEST: "bg-yellow-100 text-yellow-800",
  HARVESTED: "bg-gray-100 text-gray-800",
  PROCESSED: "bg-purple-100 text-purple-800",
};

export default function QrCodesPage() {
  const t = useTranslations('fieldAgent.qrCodes');
  const [cropBatches, setCropBatches] = useState<CropBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedBatch, setSelectedBatch] = useState<CropBatch | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadCropBatches();
  }, []);

  const loadCropBatches = async () => {
    try {
      const batchesData = await getCropBatches();
      setCropBatches(batchesData);
    } catch (error) {
      toast.error(t('failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodeData = (batch: CropBatch) => {
    return {
      type: "crop_batch",
      batchCode: batch.batchCode,
      farmCode: batch.farm.farmCode,
      farmerId: batch.farmer.farmerId,
      cropType: batch.cropType,
      variety: batch.variety,
      plantingDate: batch.plantingDate,
      expectedHarvest: batch.expectedHarvest,
      status: batch.status,
      url: `${window.location.origin}/track/${batch.batchCode}`,
      qrCode: batch.qrCode,
      generatedAt: new Date().toISOString()
    };
  };

  const previewQRCode = async (batch: CropBatch) => {
    try {
      setGeneratingQR(batch.id);
      const qrData = generateQRCodeData(batch);
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCodeLib.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      setQrCodeDataUrl(qrCodeDataUrl);
      setSelectedBatch(batch);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating QR code preview:", error);
      toast.error(t('qrPreviewFailed'));
    } finally {
      setGeneratingQR(null);
    }
  };

  const downloadQRCode = async (batch: CropBatch) => {
    try {
      setGeneratingQR(batch.id);
      const qrData = generateQRCodeData(batch);
      
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCodeLib.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `QR_${batch.batchCode}_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(t('qrDownloadSuccess', { batchCode: batch.batchCode }));
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error(t('qrGenerationFailed'));
    } finally {
      setGeneratingQR(null);
    }
  };

  const downloadFromPreview = () => {
    if (qrCodeDataUrl && selectedBatch) {
      const link = document.createElement('a');
      link.href = qrCodeDataUrl;
      link.download = `QR_${selectedBatch.batchCode}_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(t('qrDownloadSuccess', { batchCode: selectedBatch.batchCode }));
      setShowPreview(false);
    }
  };

  const filteredBatches = cropBatches.filter(batch => {
    const matchesSearch = 
      batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.farmer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const uniqueStatuses = Array.from(new Set(cropBatches.map(batch => batch.status)));

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-16" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalBatches')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cropBatches.length}</div>
            <p className="text-xs text-muted-foreground">
              {t('availableForQR')}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeBatches')}</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cropBatches.filter(b => b.status === 'GROWING' || b.status === 'PLANTED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('currentlyGrowing')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('readyForHarvest')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cropBatches.filter(b => b.status === 'READY_FOR_HARVEST').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('needQRForHarvest')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('harvested')}</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cropBatches.filter(b => b.status === 'HARVESTED' || b.status === 'PROCESSED').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('completedHarvests')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('qrCodeGenerator')}</CardTitle>
          <CardDescription>
            {t('qrCodeGeneratorDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                {t('allStatus')}
              </Button>
              {uniqueStatuses.map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status.replace(/_/g, " ")}
                </Button>
              ))}
            </div>
          </div>

          {/* Crop Batches Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredBatches.map((batch) => (
              <Card key={batch.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{batch.batchCode}</CardTitle>
                    <Badge className={statusColors[batch.status] || "bg-gray-100 text-gray-800"}>
                      {batch.status.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center">
                    <Sprout className="mr-1 h-4 w-4" />
                    {batch.cropType} • {batch.quantity || 'Not set'} {batch.unit || ''}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Building2 className="mr-2 h-4 w-4" />
                      <span>{batch.farm.name} ({batch.farm.farmCode})</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <User className="mr-2 h-4 w-4" />
                      <span>{batch.farmer.name} ({batch.farmer.farmerId})</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Planted: {batch.plantingDate ? formatDate(batch.plantingDate) : 'Not set'}</span>
                    </div>
                    {batch.expectedHarvest && (
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Expected Harvest: {formatDate(batch.expectedHarvest)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={() => downloadQRCode(batch)}
                      className="flex-1"
                      size="sm"
                      disabled={generatingQR === batch.id}
                    >
                      {generatingQR === batch.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <QrCode className="mr-2 h-4 w-4" />
                      )}
                      {t('download')}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => previewQRCode(batch)}
                      disabled={generatingQR === batch.id}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredBatches.length === 0 && (
            <div className="text-center py-8">
              <QrCode className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">{t('noBatchesFound')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('noBatchesFoundDesc')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('qrCodePreview')}</DialogTitle>
            <DialogDescription>
              {selectedBatch && `${t('batchInformation')}: ${selectedBatch.batchCode}`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBatch && (
            <div className="space-y-4">
              <div className="flex justify-center p-4 bg-white rounded-lg border">
                {qrCodeDataUrl && (
                  <img 
                    src={qrCodeDataUrl} 
                    alt={`QR Code for ${selectedBatch.batchCode}`}
                    className="w-64 h-64"
                  />
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div><strong>Batch Code:</strong> {selectedBatch.batchCode}</div>
                <div><strong>Crop Type:</strong> {selectedBatch.cropType}</div>
                <div><strong>Farm:</strong> {selectedBatch.farm.name}</div>
                <div><strong>Farmer:</strong> {selectedBatch.farmer.name}</div>
                <div><strong>Status:</strong> {selectedBatch.status.replace(/_/g, " ")}</div>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={downloadFromPreview} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  {t('downloadQRCode')}
                </Button>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  {t('close')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
