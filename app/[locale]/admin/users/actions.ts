'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity-logger'
import { Role } from '@/lib/generated/prisma/client'

interface ActionResult {
  error: string | null
  message: string | null
  user?: any
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

export async function createUser(formData: FormData): Promise<ActionResult> {
  const { error: permissionError } = await checkAdminPermission()
  if (permissionError) {
    return { error: permissionError, message: null }
  }

  const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string | null
  const role = formData.get('role') as Role

  // Validate inputs
  if (!email || !password || !role) {
    return { error: 'Email, password, and role are required.', message: null }
  }
  const validRoles = [
    'admin',
    'manager',
    'field_agent',
    'procurement_officer',
    'warehouse_manager',
    'transport_driver',
    'transport_coordinator'
  ];
  if (!validRoles.includes(role)) {
    return { error: 'Invalid role. Must be one of: ' + validRoles.join(', ') + '.', message: null }
  }

  // Create user with Supabase Admin API
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, role },
  })

  if (error) {
    return { error: error.message, message: null }
  }

  // Create profile in database
  if (data.user) {
    try {
      const profile = await prisma.profile.create({
        data: {
          userId: data.user.id,
          email: data.user.email,
          name: name || null,
          role: role,
        },
      })

      // Log the activity
      const { user: currentUser } = await checkAdminPermission()
      if (currentUser) {
        await logActivity({
          userId: currentUser.id,
          action: 'CREATE_USER',
          entityType: 'USER',
          entityId: data.user.id,
          details: { email, name, role },
        })
      }

      // Return the created user data
      const userData = {
        userId: data.user.id,
        email: data.user.email,
        name: name,
        role: role,
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        warehouseId: null,
        warehouse: null
      };

      revalidatePath('/admin/users')
      return { 
        error: null, 
        message: `User ${email} created successfully with role ${role}.`,
        user: userData
      };
    } catch (dbError) {
      console.error('Failed to create profile:', dbError)
      return { error: 'Database error creating user profile.', message: null }
    }
  }

  revalidatePath('/admin/users')
  return { error: null, message: `User ${email} created successfully with role ${role}.` }
}

export async function updateUserRole(userId: string, newRole: Role): Promise<ActionResult> {
  const { error: permissionError } = await checkAdminPermission()
  if (permissionError) {
    return { error: permissionError, message: null }
  }

  try {
    await prisma.profile.update({
      where: { userId },
      data: { role: newRole },
    })

    revalidatePath('/admin/users')
    return { error: null, message: `User role updated to ${newRole} successfully.` }
  } catch (error) {
    return { error: 'Failed to update user role.', message: null }
  }
}

export async function deactivateUser(userEmail: string): Promise<ActionResult> {
  const { error: permissionError, user: currentUser } = await checkAdminPermission()
  if (permissionError || !currentUser) {
    return { error: permissionError || 'Authentication failed', message: null }
  }

  // Validate userEmail
  if (!userEmail || typeof userEmail !== 'string') {
    return { error: 'Invalid user email provided.', message: null }
  }

  try {
    // First, verify the user exists
    const userProfile = await prisma.profile.findFirst({
      where: { 
        email: userEmail,
        NOT: { email: null }
      },
      select: { id: true, userId: true, name: true, email: true, role: true, isActive: true }
    })

    if (!userProfile) {
      return { error: 'User not found or has no email address', message: null }
    }

    console.log('Found user profile:', userProfile)

    // Use a simple updateMany approach without transaction
    const updateResult = await prisma.profile.updateMany({
      where: { 
        email: userEmail,
        NOT: { email: null }
      },
      data: { 
        isActive: false
      }
    })

    console.log('Update result:', updateResult)

    if (updateResult.count === 0) {
      return { error: 'No user was updated', message: null }
    }

    // Log the activity
    await logActivity({
      userId: currentUser.id,
      action: 'DEACTIVATE_USER',
      entityType: 'USER',
      entityId: userProfile.userId,
      details: {
        deactivatedUser: userProfile.name || userProfile.email,
        role: userProfile.role,
        email: userEmail
      }
    })

    revalidatePath('/admin/users')
    return { error: null, message: 'User account deactivated successfully.' }
  } catch (error) {
    console.error('Error deactivating user:', error)
    console.error('User Email:', userEmail)
    return { error: `Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`, message: null }
  }
}

export async function reactivateUser(userEmail: string): Promise<ActionResult> {
  const { error: permissionError, user: currentUser } = await checkAdminPermission()
  if (permissionError || !currentUser) {
    return { error: permissionError || 'Authentication failed', message: null }
  }

  // Validate userEmail
  if (!userEmail || typeof userEmail !== 'string') {
    return { error: 'Invalid user email provided.', message: null }
  }

  try {
    // First, verify the user exists
    const userProfile = await prisma.profile.findFirst({
      where: { 
        email: userEmail,
        NOT: { email: null }
      },
      select: { id: true, userId: true, name: true, email: true, role: true, isActive: true }
    })

    if (!userProfile) {
      return { error: 'User not found or has no email address', message: null }
    }

    console.log('Found user profile:', userProfile)

    // Use a simple updateMany approach without transaction
    const updateResult = await prisma.profile.updateMany({
      where: { 
        email: userEmail,
        NOT: { email: null }
      },
      data: { 
        isActive: true
      }
    })

    console.log('Update result:', updateResult)

    if (updateResult.count === 0) {
      return { error: 'No user was updated', message: null }
    }

    // Log the activity
    await logActivity({
      userId: currentUser.id,
      action: 'REACTIVATE_USER',
      entityType: 'USER',
      entityId: userProfile.userId,
      details: {
        reactivatedUser: userProfile.name || userProfile.email,
        role: userProfile.role,
        email: userEmail
      }
    })

    revalidatePath('/admin/users')
    return { error: null, message: 'User account reactivated successfully.' }
  } catch (error) {
    console.error('Error reactivating user:', error)
    console.error('User Email:', userEmail)
    return { error: `Failed to reactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`, message: null }
  }
}
