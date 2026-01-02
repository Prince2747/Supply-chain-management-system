'use server'

import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

const DASHBOARD_LOCALES = ['en', 'am'] as const

function revalidateDashboardPath(pathWithoutLocale: string) {
  for (const locale of DASHBOARD_LOCALES) {
    revalidatePath(`/${locale}${pathWithoutLocale}`)
  }
}

type StockRequirementRow = {
  cropType: string
  minStock: number
  unit: string
}

export async function getStockRequirementsFromDb(): Promise<StockRequirementRow[]> {
  // Uses raw SQL because this repo commits a generated Prisma client
  // (lib/generated/prisma) which would otherwise need regeneration.
  const rows = await prisma.$queryRaw<StockRequirementRow[]>`
    SELECT "cropType", "minStock", "unit"
    FROM "public"."StockRequirement"
    ORDER BY "cropType" ASC
  `
  return rows
}

export async function upsertStockRequirement(input: {
  cropType: string
  minStock: number
  unit?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' } as const
  }

  const procurementOfficer = await prisma.profile.findFirst({
    where: {
      userId: user.id,
      role: { in: ['procurement_officer', 'admin', 'manager'] },
      isActive: true,
    },
    select: { userId: true },
  })

  if (!procurementOfficer) {
    return { success: false, error: 'Unauthorized' } as const
  }

  const cropType = (input.cropType || '').trim()
  const minStock = Number(input.minStock)
  const unit = (input.unit || 'kg').trim() || 'kg'

  if (!cropType) {
    return { success: false, error: 'Crop type is required' } as const
  }

  if (!Number.isFinite(minStock) || minStock < 0) {
    return { success: false, error: 'Minimum stock must be a non-negative number' } as const
  }

  // Upsert into the new table.
  await prisma.$executeRaw`
    INSERT INTO "public"."StockRequirement" ("cropType", "minStock", "unit", "createdBy", "updatedBy")
    VALUES (${cropType}, ${minStock}, ${unit}, ${user.id}::uuid, ${user.id}::uuid)
    ON CONFLICT ("cropType") DO UPDATE
    SET "minStock" = EXCLUDED."minStock",
        "unit" = EXCLUDED."unit",
        "updatedBy" = ${user.id}::uuid,
        "updatedAt" = CURRENT_TIMESTAMP
  `

  await logActivity({
    userId: user.id,
    action: 'UPSERT_STOCK_REQUIREMENT',
    entityType: 'StockRequirement',
    details: {
      cropType,
      minStock,
      unit,
    },
  })

  revalidateDashboardPath('/dashboard/procurement-officer/stock-requirements')
  return { success: true } as const
}

export async function getProcurementCropBatches(userId: string) {
  try {
    const cropBatches = await prisma.cropBatch.findMany({
      where: {
        status: {
          // Only show batches that have been approved by procurement (after batch review)
          // so transport can't be assigned while still growing / not harvested.
          in: ['PROCESSED']
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
        role: { in: ['procurement_officer', 'admin', 'manager'] },
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
          // Only allow transport requests after procurement has approved the batch.
          // Harvest workflow: HARVESTED -> (review) -> PROCESSED -> (transport) -> SHIPPED.
          in: ['PROCESSED']
        }
      },
      include: {
        farm: true,
        farmer: true
      }
    })

    if (!cropBatch) {
      throw new Error('Crop batch not found or not ready for transport (must be PROCESSED)')
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

    // Update crop batch status and assign warehouse.
    // Transport coordinator will create the actual transport task later.
    await prisma.cropBatch.update({
      where: { id: data.cropBatchId },
      data: { 
        status: 'SHIPPED',
        warehouseId: data.warehouseId
      }
    })

    // Notify coordinator + destination warehouse managers that a batch is ready to be scheduled.
    try {
      const warehouseManagers = await prisma.profile.findMany({
        where: {
          role: 'warehouse_manager',
          isActive: true,
          warehouseId: data.warehouseId,
        },
        select: { userId: true },
      })

      const notifications: Array<{ sentTo: string; message: string }> = []

      notifications.push({
        sentTo: coordinator.userId,
        message: `New transport request: Batch ${cropBatch.batchCode} assigned to warehouse ${warehouse.name} (${warehouse.code}). Please schedule transport.`,
      })

      for (const wm of warehouseManagers) {
        notifications.push({
          sentTo: wm.userId,
          message: `Incoming shipment: Batch ${cropBatch.batchCode} is assigned to your warehouse (${warehouse.name}). Awaiting scheduling and delivery.`,
        })
      }

      if (notifications.length > 0) {
        await prisma.harvestNotification.createMany({
          data: notifications.map((n) => ({
            cropBatchId: data.cropBatchId,
            sentTo: n.sentTo,
            isRead: false,
            notificationType: 'GENERAL',
            message: n.message,
          }))
        })
      }
    } catch (e) {
      console.warn('Failed to send assignment notifications:', e)
    }

    // Log the activity
    await logActivity({
      userId: procurementOfficerId,
      action: 'ASSIGN_TRANSPORT',
      entityType: 'CropBatch',
      entityId: data.cropBatchId,
      details: {
        message: `Requested transport for crop batch ${cropBatch.batchCode} to coordinator ${coordinator.name}`,
        coordinatorId: data.coordinatorId,
        warehouseId: data.warehouseId,
      },
    })

    revalidateDashboardPath('/dashboard/procurement-officer')
    
    return { success: true }
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

export async function notifyFieldAgentsLowStock(input: { cropType: string; minStock?: number }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthorized' } as const
  }

  const procurementOfficer = await prisma.profile.findFirst({
    where: {
      userId: user.id,
      role: { in: ['procurement_officer', 'admin', 'manager'] },
      isActive: true,
    },
    select: { userId: true, name: true },
  })

  if (!procurementOfficer) {
    return { success: false, error: 'Unauthorized' } as const
  }

  const cropType = (input.cropType || '').trim()

  // Prefer DB-backed minStock if present.
  const dbReq = await prisma.$queryRaw<StockRequirementRow[]>`
    SELECT "cropType", "minStock", "unit"
    FROM "public"."StockRequirement"
    WHERE "cropType" = ${cropType}
    LIMIT 1
  `
  const minStock = Number(dbReq[0]?.minStock ?? input.minStock)

  if (!cropType) {
    return { success: false, error: 'Crop type is required' } as const
  }

  if (!Number.isFinite(minStock) || minStock <= 0) {
    return { success: false, error: 'Minimum stock must be a positive number' } as const
  }

  const currentStockAgg = await prisma.cropBatch.aggregate({
    where: {
      cropType,
      status: {
        in: ['PROCESSED', 'RECEIVED', 'STORED'],
      },
    },
    _sum: { quantity: true },
  })

  const currentStock = currentStockAgg._sum.quantity || 0

  if (currentStock >= minStock) {
    return { success: false, error: 'Stock is not below minimum' } as const
  }

  // Pick any representative batch to associate with the notification (schema requires cropBatchId).
  const representativeBatch = await prisma.cropBatch.findFirst({
    where: { cropType },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, batchCode: true },
  })

  if (!representativeBatch) {
    return { success: false, error: 'No inventory batch found for this crop type' } as const
  }

  const fieldAgents = await prisma.profile.findMany({
    where: {
      role: 'field_agent',
      isActive: true,
    },
    select: { userId: true },
  })

  if (fieldAgents.length === 0) {
    return { success: false, error: 'No active field agents found' } as const
  }

  const message = `Low stock alert: ${cropType} is below minimum (${currentStock} < ${minStock}). Please procure more ${cropType}.`

  await prisma.harvestNotification.createMany({
    data: fieldAgents.map((fa) => ({
      cropBatchId: representativeBatch.id,
      sentTo: fa.userId,
      isRead: false,
      notificationType: 'GENERAL',
      message,
    })),
  })

  await logActivity({
    userId: user.id,
    action: 'LOW_STOCK_NOTIFY_FIELD_AGENTS',
    entityType: 'CropBatch',
    entityId: representativeBatch.id,
    details: {
      message: `Sent low-stock procurement notification for ${cropType}`,
      cropType,
      minStock,
      currentStock,
    },
  })

  revalidateDashboardPath('/dashboard/field-agent/notifications')
  return { success: true } as const
}