'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'

interface ActionResult {
  error: string | null
  message: string | null
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

export async function createUnit(formData: FormData): Promise<ActionResult> {
  const { error: permissionError, user } = await checkAdminPermission()
  if (permissionError || !user) {
    return { error: permissionError || 'Authentication failed', message: null }
  }

  const name = formData.get('name') as string
  const code = formData.get('code') as string
  const category = formData.get('category') as string
  const baseUnit = formData.get('baseUnit') as string | null
  const conversionFactor = formData.get('conversionFactor') as string | null

  // Validate inputs
  if (!name || !code || !category) {
    return { error: 'Name, code, and category are required.', message: null }
  }

  try {
    const unit = await prisma.unitOfMeasurement.create({
      data: {
        name,
        code,
        category,
        baseUnit: baseUnit || null,
        conversionFactor: conversionFactor ? parseFloat(conversionFactor) : null,
        createdBy: user.id,
      },
    })

    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'CREATE_UNIT',
      entityType: 'UNIT',
      entityId: unit.id,
      details: { name, code, category, baseUnit, conversionFactor },
    })

    revalidatePath('/admin/units')
    return { error: null, message: `Unit "${name}" created successfully.` }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'A unit with this code already exists.', message: null }
    }
    return { error: 'Failed to create unit.', message: null }
  }
}

export async function updateUnit(unitId: string, formData: FormData): Promise<ActionResult> {
  const { error: permissionError, user } = await checkAdminPermission()
  if (permissionError || !user) {
    return { error: permissionError || 'Authentication failed', message: null }
  }

  const name = formData.get('name') as string
  const code = formData.get('code') as string
  const category = formData.get('category') as string
  const baseUnit = formData.get('baseUnit') as string | null
  const conversionFactor = formData.get('conversionFactor') as string | null

  if (!name || !code || !category) {
    return { error: 'Name, code, and category are required.', message: null }
  }

  try {
    const unit = await prisma.unitOfMeasurement.update({
      where: { id: unitId },
      data: {
        name,
        code,
        category,
        baseUnit: baseUnit || null,
        conversionFactor: conversionFactor ? parseFloat(conversionFactor) : null,
      },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE_UNIT',
      entityType: 'UNIT',
      entityId: unit.id,
      details: { name, code, category, baseUnit, conversionFactor },
    })

    revalidatePath('/admin/units')
    return { error: null, message: `Unit "${name}" updated successfully.` }
  } catch (error: any) {
    if (error.code === 'P2002') {
      return { error: 'A unit with this code already exists.', message: null }
    }
    return { error: 'Failed to update unit.', message: null }
  }
}

export async function deleteUnit(unitId: string): Promise<ActionResult> {
  const { error: permissionError, user } = await checkAdminPermission()
  if (permissionError || !user) {
    return { error: permissionError || 'Authentication failed', message: null }
  }

  try {
    const unit = await prisma.unitOfMeasurement.delete({
      where: { id: unitId },
    })

    await logActivity({
      userId: user.id,
      action: 'DELETE_UNIT',
      entityType: 'UNIT',
      entityId: unit.id,
      details: { name: unit.name, code: unit.code },
    })

    revalidatePath('/admin/units')
    return { error: null, message: 'Unit deleted successfully.' }
  } catch (error) {
    return { error: 'Failed to delete unit.', message: null }
  }
}

export async function toggleUnitStatus(unitId: string, isActive: boolean): Promise<ActionResult> {
  const { error: permissionError, user } = await checkAdminPermission()
  if (permissionError || !user) {
    return { error: permissionError || 'Authentication failed', message: null }
  }

  try {
    const unit = await prisma.unitOfMeasurement.update({
      where: { id: unitId },
      data: { isActive },
    })

    await logActivity({
      userId: user.id,
      action: 'UPDATE_UNIT',
      entityType: 'UNIT',
      entityId: unit.id,
      details: { action: isActive ? 'activated' : 'deactivated' },
    })

    revalidatePath('/admin/units')
    return { error: null, message: `Unit ${isActive ? 'activated' : 'deactivated'} successfully.` }
  } catch (error) {
    return { error: 'Failed to update unit status.', message: null }
  }
}
