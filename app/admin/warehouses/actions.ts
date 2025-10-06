'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'

interface ActionResult {
  error: string | null
  message: string | null
  warehouse?: any
}

async function checkAdminPermission() {
  const supabase = await createClient()
  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    return { error: 'You must be logged in.', user: null }
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: currentUser.id },
  })

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can perform this action.', user: null }
  }

  return { error: null, user: currentUser }
}

export async function createWarehouse(formData: FormData): Promise<ActionResult> {
  const { error: permissionError, user } = await checkAdminPermission()
  if (permissionError || !user) {
    return { error: permissionError || 'Authentication failed', message: null }
  }

  const name = formData.get('name') as string
  const code = formData.get('code') as string
  const address = formData.get('address') as string | null
  const city = formData.get('city') as string | null
  const country = formData.get('country') as string | null
  const capacity = formData.get('capacity') as string | null

  // Validate inputs
  if (!name || !code) {
    return { error: 'Name and code are required.', message: null }
  }

  try {
    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        address: address || null,
        city: city || null,
        country: country || null,
        capacity: capacity ? parseInt(capacity) : null,
        createdBy: user.id,
      },
    })

    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_WAREHOUSE',
      entityType: 'WAREHOUSE',
      entityId: warehouse.id,
      details: { name, code, address, city, country, capacity },
    })

    revalidatePath('/admin/warehouses')
    return { 
      error: null, 
      message: `Warehouse "${name}" created successfully.`,
      warehouse: warehouse
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'A warehouse with this code already exists.', message: null }
    }
    return { error: 'Failed to create warehouse.', message: null }
  }
}

export async function updateWarehouse(warehouseId: string, formData: FormData): Promise<ActionResult> {
  const { error: permissionError, user } = await checkAdminPermission()
  if (permissionError || !user) {
    return { error: permissionError || 'Authentication failed', message: null }
  }

  const name = formData.get('name') as string
  const code = formData.get('code') as string
  const address = formData.get('address') as string | null
  const city = formData.get('city') as string | null
  const country = formData.get('country') as string | null
  const capacity = formData.get('capacity') as string | null

  if (!name || !code) {
    return { error: 'Name and code are required.', message: null }
  }

  try {
    const warehouse = await prisma.warehouse.update({
      where: { id: warehouseId },
      data: {
        name,
        code,
        address: address || null,
        city: city || null,
        country: country || null,
        capacity: capacity ? parseInt(capacity) : null,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE_WAREHOUSE',
      entityType: 'WAREHOUSE',
      entityId: warehouse.id,
      details: { name, code, address, city, country, capacity },
    })

    revalidatePath('/admin/warehouses')
    return { 
      error: null, 
      message: `Warehouse "${name}" updated successfully.`,
      warehouse: warehouse
    }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'A warehouse with this code already exists.', message: null }
    }
    return { error: 'Failed to update warehouse.', message: null }
  }
}

export async function deleteWarehouse(warehouseId: string): Promise<ActionResult> {
  const { error: permissionError, user } = await checkAdminPermission()
  if (permissionError || !user) {
    return { error: permissionError || 'Authentication failed', message: null }
  }

  try {
    const warehouse = await prisma.warehouse.delete({
      where: { id: warehouseId },
    })

    await logActivity({
      userId: user.id,
      action: 'DELETE_WAREHOUSE',
      entityType: 'WAREHOUSE',
      entityId: warehouse.id,
      details: { name: warehouse.name, code: warehouse.code },
    })

    revalidatePath('/admin/warehouses')
    return { error: null, message: 'Warehouse deleted successfully.' }
  } catch (error) {
    return { error: 'Failed to delete warehouse.', message: null }
  }
}

export async function toggleWarehouseStatus(warehouseId: string, isActive: boolean): Promise<ActionResult> {
  const { error: permissionError, user } = await checkAdminPermission()
  if (permissionError || !user) {
    return { error: permissionError || 'Authentication failed', message: null }
  }

  try {
    const warehouse = await prisma.warehouse.update({
      where: { id: warehouseId },
      data: { isActive },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE_WAREHOUSE',
      entityType: 'WAREHOUSE',
      entityId: warehouse.id,
      details: { action: isActive ? 'activated' : 'deactivated' },
    })

    revalidatePath('/admin/warehouses')
    return { error: null, message: `Warehouse ${isActive ? 'activated' : 'deactivated'} successfully.` }
  } catch (error) {
    return { error: 'Failed to update warehouse status.', message: null }
  }
}
