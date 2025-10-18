'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  Package, 
  Truck, 
  User, 
  MapPin, 
  Calendar,
  Clock,
  Building2,
  Loader2
} from 'lucide-react'

interface CropBatch {
  id: string
  batchCode: string
  cropType: string
  variety?: string | null
  quantity?: number | null
  unit?: string | null
  status: string
  actualHarvest?: Date | null
  notes?: string | null
  farm: {
    id: string
    name: string
    location?: string | null
  }
  farmer: {
    id: string
    name: string | null
  }
  warehouse?: {
    id: string
    name: string
    code: string
  } | null
}

interface TransportCoordinator {
  id: string
  userId: string
  name: string | null
  email: string | null
}

interface Warehouse {
  id: string
  name: string
  code: string
  city?: string | null
}

interface TransportAssignmentModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  cropBatch: CropBatch | null
  transportCoordinators: TransportCoordinator[]
  warehouses: Warehouse[]
  onAssignTransport: (data: any) => Promise<void>
}

function TransportAssignmentModal({
  isOpen,
  onOpenChange,
  cropBatch,
  transportCoordinators,
  warehouses,
  onAssignTransport
}: TransportAssignmentModalProps) {
  const [selectedCoordinator, setSelectedCoordinator] = useState('')
  const [selectedWarehouse, setSelectedWarehouse] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [pickupLocation, setPickupLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  // Auto-populate pickup location from farm location
  useEffect(() => {
    if (cropBatch?.farm.location) {
      setPickupLocation(cropBatch.farm.location)
    }
  }, [cropBatch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cropBatch || !selectedCoordinator || !selectedWarehouse || !scheduledDate) {
      toast.error('Please fill in all required fields')
      return
    }

    startTransition(async () => {
      try {
        await onAssignTransport({
          cropBatchId: cropBatch.id,
          coordinatorId: selectedCoordinator,
          warehouseId: selectedWarehouse,
          scheduledDate: new Date(scheduledDate),
          pickupLocation: pickupLocation || cropBatch.farm.location || cropBatch.farm.name,
          notes
        })
        
        // Reset form
        setSelectedCoordinator('')
        setSelectedWarehouse('')
        setScheduledDate('')
        setPickupLocation('')
        setNotes('')
        onOpenChange(false)
        
        toast.success('Transport task assigned successfully')
      } catch (error) {
        toast.error('Failed to assign transport task')
      }
    })
  }

  if (!cropBatch) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Assign Transport Task
          </DialogTitle>
          <DialogDescription>
            Assign crop batch {cropBatch.batchCode} to a transport coordinator for delivery to warehouse.
          </DialogDescription>
        </DialogHeader>

        {/* Crop Batch Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Batch Code</Label>
              <p className="font-mono text-sm">{cropBatch.batchCode}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Crop Type</Label>
              <p className="text-sm">{cropBatch.cropType} {cropBatch.variety && `(${cropBatch.variety})`}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Quantity</Label>
              <p className="text-sm">{cropBatch.quantity || 'Not specified'} {cropBatch.unit || ''}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Farm</Label>
              <p className="text-sm">{cropBatch.farm.name}</p>
            </div>
          </div>

          {/* Assignment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="coordinator">Transport Coordinator *</Label>
                <Select value={selectedCoordinator} onValueChange={setSelectedCoordinator} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select coordinator" />
                  </SelectTrigger>
                  <SelectContent>
                    {transportCoordinators.map((coordinator) => (
                      <SelectItem key={coordinator.userId} value={coordinator.userId}>
                        {coordinator.name || 'Unnamed Coordinator'} ({coordinator.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warehouse">Destination Warehouse *</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.code}) {warehouse.city ? `- ${warehouse.city}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Pickup Date *</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupLocation">Pickup Location</Label>
                <Input
                  id="pickupLocation"
                  placeholder="Enter pickup location"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Transport Notes</Label>
              <Textarea
                id="notes"
                placeholder="Special instructions, handling requirements, or other notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isPending || !selectedCoordinator || !selectedWarehouse || !scheduledDate}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Transport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ProcurementDashboardProps {
  initialCropBatches: CropBatch[]
  transportCoordinators: TransportCoordinator[]
  warehouses: Warehouse[]
  onAssignTransport: (data: any) => Promise<void>
}

export function ProcurementDashboard({ 
  initialCropBatches, 
  transportCoordinators, 
  warehouses,
  onAssignTransport 
}: ProcurementDashboardProps) {
  const [cropBatches, setCropBatches] = useState<CropBatch[]>(initialCropBatches)
  const [selectedBatch, setSelectedBatch] = useState<CropBatch | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)

  const statusColors = {
    PLANTED: 'bg-blue-100 text-blue-800',
    GROWING: 'bg-green-100 text-green-800',
    READY_FOR_HARVEST: 'bg-yellow-100 text-yellow-800',
    HARVESTED: 'bg-orange-100 text-orange-800',
    PROCESSED: 'bg-purple-100 text-purple-800',
    READY_FOR_PACKAGING: 'bg-indigo-100 text-indigo-800',
    PACKAGING: 'bg-pink-100 text-pink-800',
    PACKAGED: 'bg-cyan-100 text-cyan-800',
    SHIPPED: 'bg-gray-100 text-gray-800',
    RECEIVED: 'bg-emerald-100 text-emerald-800',
    STORED: 'bg-slate-100 text-slate-800'
  }

  const handleAssignTransport = async (batchId: string) => {
    const batch = cropBatches.find(b => b.id === batchId)
    if (batch) {
      setSelectedBatch(batch)
      setIsAssignModalOpen(true)
    }
  }

  const readyBatches = cropBatches.filter(batch => 
    batch.status === 'READY_FOR_HARVEST' || batch.status === 'PROCESSED'
  )

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Crop Batches Ready for Transport
          </CardTitle>
          <CardDescription>
            Assign crop batches to transport coordinators for delivery to warehouses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {readyBatches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No crop batches ready for transport assignment</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Code</TableHead>
                    <TableHead>Crop Type</TableHead>
                    <TableHead>Farm</TableHead>
                    <TableHead>Farmer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Harvest Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {readyBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono text-sm">{batch.batchCode}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{batch.cropType}</p>
                          {batch.variety && (
                            <p className="text-sm text-gray-500">{batch.variety}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{batch.farm.name}</p>
                          {batch.farm.location && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {batch.farm.location}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{batch.farmer.name || 'Unknown Farmer'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[batch.status as keyof typeof statusColors]}>
                          {batch.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {batch.quantity ? `${batch.quantity} ${batch.unit || ''}` : 'Not specified'}
                      </TableCell>
                      <TableCell>
                        {batch.actualHarvest ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(batch.actualHarvest).toLocaleDateString()}
                          </div>
                        ) : (
                          <span className="text-gray-400">Not harvested</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleAssignTransport(batch.id)}
                          className="flex items-center gap-1"
                        >
                          <Truck className="h-4 w-4" />
                          Assign Transport
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TransportAssignmentModal
        isOpen={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        cropBatch={selectedBatch}
        transportCoordinators={transportCoordinators}
        warehouses={warehouses}
        onAssignTransport={onAssignTransport}
      />
    </div>
  )
}