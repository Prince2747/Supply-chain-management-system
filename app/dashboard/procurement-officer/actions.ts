'use server'

import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'
import { revalidatePath } from 'next/cache'

export async function getProcurementCropBatches(userId: string) {
  try {
    const cropBatches = await prisma.cropBatch.findMany({
      where: {
        status: {
          in: ['READY_FOR_HARVEST', 'PROCESSED']
        }
      },
      include: {
        farm: true,
        farmer: true,
        warehouse: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return cropBatches
  } catch (error) {
    console.error('Error fetching crop batches:', error)
    throw new Error('Failed to fetch crop batches')
  }
}

export async function getTransportCoordinators() {
  try {
    const coordinators = await prisma.profile.findMany({
      where: {
        role: 'transport_coordinator',
        isActive: true
      },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true
      }
    })

    return coordinators
  } catch (error) {
    console.error('Error fetching transport coordinators:', error)
    throw new Error('Failed to fetch transport coordinators')
  }
}

export async function getWarehouses() {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        code: true,
        city: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return warehouses
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    throw new Error('Failed to fetch warehouses')
  }
}

export async function assignTransportTask(
  procurementOfficerId: string,
  data: {
    cropBatchId: string
    coordinatorId: string
    warehouseId: string
    scheduledDate: Date
    pickupLocation: string
    notes?: string
  }
) {
  try {
    // Verify the procurement officer exists and has the right role
    const procurementOfficer = await prisma.profile.findFirst({
      where: {
        userId: procurementOfficerId,
        role: 'procurement_officer',
        isActive: true
      }
    })

    if (!procurementOfficer) {
      throw new Error('Unauthorized: Procurement officer not found')
    }

    // Verify the crop batch exists and is ready for transport
    const cropBatch = await prisma.cropBatch.findFirst({
      where: {
        id: data.cropBatchId,
        status: {
          in: ['READY_FOR_HARVEST', 'PROCESSED']
        }
      },
      include: {
        farm: true,
        farmer: true
      }
    })

    if (!cropBatch) {
      throw new Error('Crop batch not found or not ready for transport')
    }

    // Verify the transport coordinator exists
    const coordinator = await prisma.profile.findFirst({
      where: {
        userId: data.coordinatorId,
        role: 'transport_coordinator',
        isActive: true
      }
    })

    if (!coordinator) {
      throw new Error('Transport coordinator not found')
    }

    // Verify the warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: {
        id: data.warehouseId,
        isActive: true
      }
    })

    if (!warehouse) {
      throw new Error('Warehouse not found')
    }

    // Create transport task
    const transportTask = await prisma.transportTask.create({
      data: {
        cropBatchId: data.cropBatchId,
        coordinatorId: data.coordinatorId,
        warehouseId: data.warehouseId,
        scheduledDate: data.scheduledDate,
        pickupLocation: data.pickupLocation,
        notes: data.notes,
        status: 'ASSIGNED'
      }
    })

    // Update crop batch status to indicate transport is assigned
    await prisma.cropBatch.update({
      where: { id: data.cropBatchId },
      data: { 
        status: 'SHIPPED',
        warehouseId: data.warehouseId
      }
    })

    // Create notification for transport coordinator
    await prisma.notification.create({
      data: {
        userId: data.coordinatorId,
        type: 'TRANSPORT_ASSIGNMENT',
        title: 'New Transport Task Assigned',
        message: `You have been assigned to transport crop batch ${cropBatch.batchCode} from ${cropBatch.farm.name} to ${warehouse.name}. Scheduled for ${data.scheduledDate.toLocaleDateString()}.`,
        metadata: {
          transportTaskId: transportTask.id,
          cropBatchId: data.cropBatchId,
          warehouseId: data.warehouseId,
          scheduledDate: data.scheduledDate.toISOString()
        }
      }
    })

    // Log the activity
    await logActivity(
      procurementOfficerId,
      'ASSIGN_TRANSPORT',
      `Assigned transport task for crop batch ${cropBatch.batchCode} to coordinator ${coordinator.name}`,
      {
        transportTaskId: transportTask.id,
        cropBatchId: data.cropBatchId,
        coordinatorId: data.coordinatorId,
        warehouseId: data.warehouseId
      }
    )

    revalidatePath('/dashboard/procurement-officer')
    
    return { success: true, transportTask }
  } catch (error) {
    console.error('Error assigning transport task:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to assign transport task')
  }
}

export async function getProcurementDashboardData(userId: string) {
  try {
    const [cropBatches, transportCoordinators, warehouses] = await Promise.all([
      getProcurementCropBatches(userId),
      getTransportCoordinators(),
      getWarehouses()
    ])

    return {
      cropBatches,
      transportCoordinators,
      warehouses
    }
  } catch (error) {
    console.error('Error fetching procurement dashboard data:', error)
    throw new Error('Failed to fetch dashboard data')
  }
}