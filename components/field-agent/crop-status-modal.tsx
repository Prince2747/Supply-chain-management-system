'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calendar, Truck, User, MapPin, Package, Loader2 } from 'lucide-react'

interface CropBatch {
  id: string
  batchCode: string
  cropType: string
  variety?: string | null
  quantity?: number | null
  unit?: string | null
  status: string
  plantingDate?: Date | null
  expectedHarvest?: Date | null
  actualHarvest?: Date | null
  farm: {
    id: string
    name: string
    location?: string | null
  }
  farmer: {
    id: string
    name: string
  }
}

interface CropStatusModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  cropBatch: CropBatch | null
  onUpdateStatus: (batchId: string, status: string, notes: string, additionalData?: any) => Promise<void>
}

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

const statusFlow = {
  PLANTED: ['GROWING'],
  GROWING: ['READY_FOR_HARVEST'],
  READY_FOR_HARVEST: ['HARVESTED'],
  HARVESTED: ['PROCESSED'],
  PROCESSED: ['READY_FOR_PACKAGING'],
  READY_FOR_PACKAGING: ['PACKAGING'],
  PACKAGING: ['PACKAGED'],
  PACKAGED: ['SHIPPED'],
  SHIPPED: ['RECEIVED'],
  RECEIVED: ['STORED']
}

export function CropStatusModal({ isOpen, onOpenChange, cropBatch, onUpdateStatus }: CropStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState('')
  const [notes, setNotes] = useState('')
  const [quantity, setQuantity] = useState('')
  const [actualHarvestDate, setActualHarvestDate] = useState('')
  const [isPending, startTransition] = useTransition()

  const availableStatuses = cropBatch ? statusFlow[cropBatch.status as keyof typeof statusFlow] || [] : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!cropBatch || !selectedStatus) {
      toast.error('Please select a status')
      return
    }

    if (!notes.trim()) {
      toast.error('Please provide status notes')
      return
    }

    startTransition(async () => {
      try {
        const additionalData: any = {}
        
        if (selectedStatus === 'HARVESTED' && actualHarvestDate) {
          additionalData.actualHarvest = new Date(actualHarvestDate)
        }
        
        if (quantity) {
          additionalData.quantity = parseFloat(quantity)
        }

        await onUpdateStatus(cropBatch.id, selectedStatus, notes, additionalData)
        
        // Reset form
        setSelectedStatus('')
        setNotes('')
        setQuantity('')
        setActualHarvestDate('')
        onOpenChange(false)
        
        toast.success(`Crop status updated to ${selectedStatus.replace('_', ' ')}`)
      } catch (error) {
        toast.error('Failed to update crop status')
      }
    })
  }

  if (!cropBatch) return null

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-green-600" />
            Update Crop Status
          </DialogTitle>
          <DialogDescription>
            Update the status of crop batch {cropBatch.batchCode} and provide details for the next stage.
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
              <Label className="text-sm font-medium text-gray-600">Current Status</Label>
              <Badge className={statusColors[cropBatch.status as keyof typeof statusColors]}>
                {cropBatch.status.replace('_', ' ')}
              </Badge>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Crop Type</Label>
              <p className="text-sm">{cropBatch.cropType} {cropBatch.variety && `(${cropBatch.variety})`}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Quantity</Label>
              <p className="text-sm">{cropBatch.quantity || 'Not specified'} {cropBatch.unit || ''}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                Farm
              </Label>
              <p className="text-sm">{cropBatch.farm.name}</p>
              {cropBatch.farm.location && <p className="text-xs text-gray-500">{cropBatch.farm.location}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                <User className="h-4 w-4" />
                Farmer
              </Label>
              <p className="text-sm">{cropBatch.farmer.name}</p>
            </div>
          </div>

          <Separator />

          {/* Status Update Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Next Status *</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select next status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Additional fields based on selected status */}
            {selectedStatus === 'HARVESTED' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="actualHarvestDate">Actual Harvest Date</Label>
                  <Input
                    id="actualHarvestDate"
                    type="date"
                    value={actualHarvestDate}
                    onChange={(e) => setActualHarvestDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Harvested Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Status Notes *</Label>
              <Textarea
                id="notes"
                placeholder="Provide detailed notes about the current condition, quality, issues, or any relevant information..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Once you update the status, a notification will be sent to the procurement officer for the next stage of processing.
              </p>
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
            disabled={isPending || !selectedStatus || !notes.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}