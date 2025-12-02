"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sprout, 
  Plus, 
  Search, 
  QrCode, 
  Calendar,
  Building2,
  User,
  Edit,
  Eye,
  Download,
  Loader2
} from "lucide-react";
import { createCropBatch, getCropBatches, getFarms, updateCropBatchStatus, updateCropStatus, getUnitsOfMeasurement } from "../actions";
import { toast } from "sonner";
import QRCode from "qrcode";
import { CropStatusModal } from "@/components/field-agent/crop-status-modal";

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
  createdAt: Date;
  farm: {
    id: string;
    name: string;
    farmCode: string;
    location: string | null;
  };
  farmer: {
    id: string;
    name: string;
    farmerId: string;
  };
  _count: {
    notifications: number;
  };
}

interface Farm {
  id: string;
  name: string;
  farmCode: string;
  farmer: {
    name: string;
    farmerId: string;
  };
}

const statusColors: Record<string, string> = {
  PLANTED: "bg-blue-100 text-blue-800",
  GROWING: "bg-green-100 text-green-800",
  READY_FOR_HARVEST: "bg-yellow-100 text-yellow-800",
  HARVESTED: "bg-purple-100 text-purple-800",
  PROCESSED: "bg-gray-100 text-gray-800",
  SHIPPED: "bg-orange-100 text-orange-800",
};

export default function CropsPage() {
  const [cropBatches, setCropBatches] = useState<CropBatch[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [units, setUnits] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedBatchForStatusUpdate, setSelectedBatchForStatusUpdate] = useState<CropBatch | null>(null);

  // Load crop batches and farms
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [batchesData, farmsData, unitsData] = await Promise.all([
        getCropBatches(),
        getFarms(),
        getUnitsOfMeasurement()
      ]);
      setCropBatches(batchesData);
      setFarms(farmsData);
      setUnits(unitsData);
    } catch (error) {
      toast.error("Failed to load data");
    }
  };

  // Filter crop batches
  const filteredBatches = cropBatches.filter(batch => {
    const matchesSearch = 
      batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.cropType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.farmer.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || batch.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleCreateCropBatch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    try {
      const result = await createCropBatch(formData);
      if (result.success) {
        toast.success("Crop batch created successfully");
        setIsCreateDialogOpen(false);
        loadData();
        (event.target as HTMLFormElement).reset();
      } else {
        toast.error(result.error || "Failed to create crop batch");
      }
    } catch (error) {
      toast.error("Failed to create crop batch");
    }
  };

  const handleStatusUpdate = async (batchId: string, newStatus: string) => {
    try {
      const result = await updateCropBatchStatus(batchId, newStatus);
      if (result.success) {
        toast.success("Status updated successfully");
        loadData();
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleOpenStatusModal = (batch: CropBatch) => {
    setSelectedBatchForStatusUpdate(batch);
    setIsStatusModalOpen(true);
  };

  const handleStatusModalUpdate = async (batchId: string, status: string, notes: string, additionalData?: any) => {
    try {
      const result = await updateCropStatus(
        batchId, 
        status, 
        notes, 
        additionalData
      );
      if (result.success) {
        toast.success("Crop status updated successfully");
        loadData();
        setIsStatusModalOpen(false);
        setSelectedBatchForStatusUpdate(null);
      } else {
        toast.error(result.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const previewQRCode = async (qrData: string) => {
    try {
      setGeneratingQR(qrData);
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrPreviewUrl(qrDataUrl);
      setSelectedQR(qrData);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error("Failed to generate QR code preview");
    } finally {
      setGeneratingQR(null);
    }
  };

  const downloadQRCode = async (qrData: string, filename: string) => {
    try {
      setGeneratingQR(qrData);
      const qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("QR code downloaded successfully");
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error("Failed to download QR code");
    } finally {
      setGeneratingQR(null);
    }
  };

  const downloadAllQRCodes = async () => {
    const batchesWithQR = cropBatches.filter(batch => batch.qrCode);
    if (batchesWithQR.length === 0) {
      toast.error("No crop batches with QR codes found");
      return;
    }

    try {
      setGeneratingQR('bulk');
      toast.info(`Generating ${batchesWithQR.length} QR codes...`);

      for (let i = 0; i < batchesWithQR.length; i++) {
        const batch = batchesWithQR[i];
        const qrDataUrl = await QRCode.toDataURL(batch.qrCode!, {
          width: 512,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        
        // Create download link
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `crop-batch-${batch.batchCode}-qr.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Small delay between downloads
        if (i < batchesWithQR.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      toast.success(`Successfully downloaded ${batchesWithQR.length} QR codes`);
    } catch (error) {
      console.error('Error downloading QR codes:', error);
      toast.error("Failed to download QR codes");
    } finally {
      setGeneratingQR(null);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const colorClass = statusColors[status] || "bg-gray-100 text-gray-800";
    return (
      <Badge className={colorClass}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crop Batch Management</h1>
          <p className="text-muted-foreground">
            Create and track crop batches with QR codes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={downloadAllQRCodes}
            disabled={generatingQR === 'bulk'}
          >
            {generatingQR === 'bulk' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Download All QR Codes
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Batch
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Crop Batch</DialogTitle>
              <DialogDescription>
                Register a new crop batch with automatic QR code generation.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateCropBatch} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cropType">Crop Type *</Label>
                  <Input id="cropType" name="cropType" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="variety">Variety</Label>
                  <Input id="variety" name="variety" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmId">Farm *</Label>
                <Select name="farmId" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id}>
                        {farm.name} ({farm.farmCode}) - {farm.farmer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plantingDate">Planting Date</Label>
                  <Input id="plantingDate" name="plantingDate" type="date" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedHarvest">Expected Harvest</Label>
                  <Input id="expectedHarvest" name="expectedHarvest" type="date" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select name="unit">
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.length > 0 ? (
                        units.map((unit) => (
                          <SelectItem key={unit.id} value={unit.code}>
                            {unit.name} ({unit.code})
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="tons">Tons</SelectItem>
                          <SelectItem value="bags">Bags</SelectItem>
                          <SelectItem value="boxes">Boxes</SelectItem>
                          <SelectItem value="pieces">Pieces</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Additional notes..." />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Batch</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cropBatches.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cropBatches.filter(b => b.qrCode).length}</div>
          </CardContent>
        </Card>
        
        {Object.entries(statusColors).slice(0, 4).map(([status, _]) => {
          const count = cropBatches.filter(b => b.status === status).length;
          return (
            <Card key={status}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {status.replace(/_/g, " ")}
                </CardTitle>
                <Sprout className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Crop Batches</CardTitle>
              <CardDescription>
                Track all crop batches and their status
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PLANTED">Planted</SelectItem>
                  <SelectItem value="GROWING">Growing</SelectItem>
                  <SelectItem value="READY_FOR_HARVEST">Ready</SelectItem>
                  <SelectItem value="HARVESTED">Harvested</SelectItem>
                </SelectContent>
              </Select>
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Code</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Farm</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Planted</TableHead>
                <TableHead>Expected Harvest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>QR Code</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>
                    <Badge variant="outline">{batch.batchCode}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{batch.cropType}</div>
                      {batch.variety && (
                        <div className="text-sm text-muted-foreground">{batch.variety}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Building2 className="mr-1 h-3 w-3" />
                      {batch.farm.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {batch.farm.farmCode}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <User className="mr-1 h-3 w-3" />
                      {batch.farmer.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {batch.farmer.farmerId}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(batch.plantingDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-1 h-3 w-3" />
                      {formatDate(batch.expectedHarvest)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge className={statusColors[batch.status] || "bg-gray-100 text-gray-800"}>
                        {batch.status.replace('_', ' ')}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenStatusModal(batch)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Update Status
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {batch.qrCode ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => previewQRCode(batch.qrCode!)}
                          disabled={generatingQR === batch.qrCode}
                        >
                          {generatingQR === batch.qrCode ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <QrCode className="h-3 w-3 mr-1" />
                          )}
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadQRCode(batch.qrCode!, `crop-batch-${batch.batchCode}`)}
                          disabled={generatingQR === batch.qrCode}
                        >
                          {generatingQR === batch.qrCode ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3 mr-1" />
                          )}
                          Download
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No QR code</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredBatches.length === 0 && (
            <div className="text-center py-8">
              <Sprout className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No crop batches found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms." : "Get started by creating your first crop batch."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      <Dialog open={!!selectedQR} onOpenChange={() => {
        setSelectedQR(null);
        setQrPreviewUrl(null);
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>QR Code Preview</DialogTitle>
            <DialogDescription>
              Scan this QR code to track the crop batch
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 p-6">
            {qrPreviewUrl && (
              <>
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <img
                    src={qrPreviewUrl}
                    alt="QR Code"
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm text-muted-foreground font-mono text-center break-all">
                  {selectedQR}
                </p>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => downloadQRCode(selectedQR!, 'crop-batch-qr')}
                    disabled={generatingQR === selectedQR}
                  >
                    {generatingQR === selectedQR ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Status Update Modal */}
      <CropStatusModal
        isOpen={isStatusModalOpen}
        onOpenChange={setIsStatusModalOpen}
        cropBatch={selectedBatchForStatusUpdate}
        onUpdateStatus={handleStatusModalUpdate}
      />
    </div>
  );
}
