'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { logAuthActivity } from '@/lib/activity-logger'
import { getRoleBasedRedirectPath } from '@/lib/navigation'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // Validate inputs
  if (!email || !password) {
    throw new Error('Email and password are required')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  // Check if user has a profile and determine role-based redirect
  if (data.user) {
    let profile = null

    try {
      profile = await prisma.profile.findUnique({
        where: { userId: data.user.id },
        select: { role: true, isActive: true, name: true, email: true }
      })
    } catch (dbError: any) {
      console.error('Error checking user profile:', dbError)

      // Handle database connection errors specifically
      if (
        dbError?.code === 'P1001' ||
        dbError?.message?.includes("Can't reach database server") ||
        dbError?.message?.includes("Connection refused")
      ) {
        throw new Error('Database connection error. Please try again later.')
      }

      // Handle other database-related Prisma errors
      if (dbError?.code?.startsWith('P') && dbError?.code !== 'P2025') {
        throw new Error('Database error occurred. Please try again later.')
      }

      // For other errors, continue without profile (will redirect to home)
      console.warn('Non-database error during profile check, continuing without profile')
    }

    // Check if user account is active
    if (profile && profile.isActive === false) {
      // Sign out the user immediately
      await supabase.auth.signOut()
      throw new Error('Your account has been deactivated. Please contact an administrator.')
    }

    // Log the activity
    await logAuthActivity(data.user.id, 'LOGIN')

    revalidatePath('/', 'layout')
    
    // Return success result with redirect path instead of redirecting immediately
    if (profile?.role) {
      const redirectPath = getRoleBasedRedirectPath(profile.role)
      return { success: true, redirectPath }
    } else {
      // If no role is found, redirect to unauthorized
      return { success: true, redirectPath: '/unauthorized' }
    }
  }
}

