'use client'

import { useState, useTransition } from 'react'
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
  Truck, 
  User, 
  MapPin, 
  Calendar,
  Clock,
  Building2,
  Loader2,
  Package,
  CheckCircle
} from 'lucide-react'

interface TransportTask {
  id: string
  status: string
  scheduledDate: Date
  pickupLocation: string
  notes?: string
  cropBatch: {
    id: string
    batchCode: string
    cropType: string
    variety?: string
    quantity?: number
    unit?: string
    farm: {
      name: string
      location?: string
    }
    farmer: {
      name: string
    }
  }
  warehouse: {
    id: string
    name: string
    code: string
    address?: string
    city?: string
  }
}

interface Driver {
  id: string
  name: string
  licenseNumber: string
  phone: string
  email?: string
  status: string
}

interface Vehicle {
  id: string
  plateNumber: string
  type: string
  capacity: number
  status: string
}

interface DriverAssignmentModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transportTask: TransportTask | null
  drivers: Driver[]
  vehicles: Vehicle[]
  onAssignDriver: (data: any) => Promise<void>
}

function DriverAssignmentModal({
  isOpen,
  onOpenChange,
  transportTask,
  drivers,
  vehicles,
  onAssignDriver
}: DriverAssignmentModalProps) {
  const [selectedDriver, setSelectedDriver] = useState('')
  const [selectedVehicle, setSelectedVehicle] = useState('')
  const [updatedSchedule, setUpdatedSchedule] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!transportTask || !selectedDriver || !selectedVehicle) {
      toast.error('Please select both driver and vehicle')
      return
    }

    startTransition(async () => {
      try {
        await onAssignDriver({
          transportTaskId: transportTask.id,
          driverId: selectedDriver,
          vehicleId: selectedVehicle,
          scheduledDate: updatedSchedule ? new Date(updatedSchedule) : transportTask.scheduledDate,
          notes: deliveryNotes
        })
        
        // Reset form
        setSelectedDriver('')
        setSelectedVehicle('')
        setUpdatedSchedule('')
        setDeliveryNotes('')
        onOpenChange(false)
        
        toast.success('Driver and vehicle assigned successfully')
      } catch (error) {
        toast.error('Failed to assign driver and vehicle')
      }
    })
  }

  if (!transportTask) return null

  const availableDrivers = drivers.filter(d => d.status === 'AVAILABLE')
  const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE')

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Assign Driver & Vehicle
          </DialogTitle>
          <DialogDescription>
            Assign driver and vehicle for crop batch {transportTask.cropBatch.batchCode} delivery to {transportTask.warehouse.name}.
          </DialogDescription>
        </DialogHeader>

        {/* Transport Task Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Batch Code</Label>
              <p className="font-mono text-sm">{transportTask.cropBatch.batchCode}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Crop</Label>
              <p className="text-sm">{transportTask.cropBatch.cropType} {transportTask.cropBatch.variety && `(${transportTask.cropBatch.variety})`}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Pickup Location</Label>
              <p className="text-sm">{transportTask.pickupLocation}</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Destination</Label>
              <p className="text-sm">{transportTask.warehouse.name} ({transportTask.warehouse.code})</p>
              {transportTask.warehouse.city && (
                <p className="text-xs text-gray-500">{transportTask.warehouse.city}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Quantity</Label>
              <p className="text-sm">
                {transportTask.cropBatch.quantity || 'Not specified'} {transportTask.cropBatch.unit || ''}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-600">Scheduled Date</Label>
              <p className="text-sm">{new Date(transportTask.scheduledDate).toLocaleString()}</p>
            </div>
          </div>

          {/* Assignment Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driver">Driver *</Label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{driver.name}</span>
                          <span className="text-xs text-gray-500">
                            License: {driver.licenseNumber} | Phone: {driver.phone}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableDrivers.length === 0 && (
                  <p className="text-sm text-red-500">No available drivers</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle *</Label>
                <Select value={selectedVehicle} onValueChange={setSelectedVehicle} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{vehicle.plateNumber}</span>
                          <span className="text-xs text-gray-500">
                            {vehicle.type} | Capacity: {vehicle.capacity} kg
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {availableVehicles.length === 0 && (
                  <p className="text-sm text-red-500">No available vehicles</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduledDate">Update Scheduled Date (Optional)</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={updatedSchedule}
                onChange={(e) => setUpdatedSchedule(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Delivery Notes</Label>
              <Textarea
                id="notes"
                placeholder="Special delivery instructions, handling requirements, or other notes..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
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
            disabled={isPending || !selectedDriver || !selectedVehicle}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Driver & Vehicle
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface TransportCoordinatorDashboardProps {
  initialTransportTasks: TransportTask[]
  drivers: Driver[]
  vehicles: Vehicle[]
  onAssignDriver: (data: any) => Promise<void>
  onUpdateTaskStatus: (taskId: string, status: string) => Promise<void>
}

export function TransportCoordinatorDashboard({ 
  initialTransportTasks, 
  drivers, 
  vehicles,
  onAssignDriver,
  onUpdateTaskStatus
}: TransportCoordinatorDashboardProps) {
  const [transportTasks, setTransportTasks] = useState<TransportTask[]>(initialTransportTasks)
  const [selectedTask, setSelectedTask] = useState<TransportTask | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const statusColors = {
    ASSIGNED: 'bg-blue-100 text-blue-800',
    SCHEDULED: 'bg-yellow-100 text-yellow-800',
    IN_TRANSIT: 'bg-orange-100 text-orange-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    DELAYED: 'bg-purple-100 text-purple-800'
  }

  const handleAssignDriver = async (taskId: string) => {
    const task = transportTasks.find(t => t.id === taskId)
    if (task) {
      setSelectedTask(task)
      setIsAssignModalOpen(true)
    }
  }

  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    startTransition(async () => {
      try {
        await onUpdateTaskStatus(taskId, newStatus)
        // Update local state
        setTransportTasks(prev => 
          prev.map(task => 
            task.id === taskId 
              ? { ...task, status: newStatus }
              : task
          )
        )
        toast.success(`Task status updated to ${newStatus.replace('_', ' ')}`)
      } catch (error) {
        toast.error('Failed to update task status')
      }
    })
  }

  const assignedTasks = transportTasks.filter(task => task.status === 'ASSIGNED')
  const scheduledTasks = transportTasks.filter(task => task.status === 'SCHEDULED')
  const inTransitTasks = transportTasks.filter(task => task.status === 'IN_TRANSIT')
  const completedTasks = transportTasks.filter(task => task.status === 'DELIVERED')

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned Tasks</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{assignedTasks.length}</div>
            <p className="text-xs text-muted-foreground">Need driver assignment</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{scheduledTasks.length}</div>
            <p className="text-xs text-muted-foreground">Ready for pickup</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Transit</CardTitle>
            <Truck className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inTransitTasks.length}</div>
            <p className="text-xs text-muted-foreground">Currently moving</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>
      </div>

      {/* Transport Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Transport Tasks
          </CardTitle>
          <CardDescription>
            Manage transport assignments and track delivery progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transportTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Truck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No transport tasks assigned</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch Code</TableHead>
                    <TableHead>Crop</TableHead>
                    <TableHead>Pickup</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transportTasks.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="font-mono text-sm">{task.cropBatch.batchCode}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.cropBatch.cropType}</p>
                          {task.cropBatch.variety && (
                            <p className="text-sm text-gray-500">{task.cropBatch.variety}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{task.pickupLocation}</p>
                          <p className="text-xs text-gray-500">{task.cropBatch.farm.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{task.warehouse.name}</p>
                          <p className="text-sm text-gray-500">{task.warehouse.code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.scheduledDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          {task.status === 'ASSIGNED' && (
                            <Button
                              size="sm"
                              onClick={() => handleAssignDriver(task.id)}
                              className="flex items-center gap-1"
                            >
                              <User className="h-4 w-4" />
                              Assign Driver
                            </Button>
                          )}
                          {task.status === 'SCHEDULED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(task.id, 'IN_TRANSIT')}
                              disabled={isPending}
                            >
                              Start Transit
                            </Button>
                          )}
                          {task.status === 'IN_TRANSIT' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(task.id, 'DELIVERED')}
                              disabled={isPending}
                            >
                              Mark Delivered
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DriverAssignmentModal
        isOpen={isAssignModalOpen}
        onOpenChange={setIsAssignModalOpen}
        transportTask={selectedTask}
        drivers={drivers}
        vehicles={vehicles}
        onAssignDriver={onAssignDriver}
      />
    </div>
  )
}