'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { logAuthActivity } from '@/lib/activity-logger'

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

  // Check if user has a profile and determine redirect
  if (data.user) {
    let profile = null

    try {
      profile = await prisma.profile.findUnique({
        where: { userId: data.user.id },
      })
    } catch (dbError: any) {
      console.error('Error checking user profile:', dbError)

      // Handle database connection errors specifically
      if (
        dbError?.code === 'P1001' ||
        dbError?.message?.includes("Can't reach database server") ||
        dbError?.message?.includes("Connection refused")
      ) {
        redirect('/error?type=database')
      }

      // Handle other database-related Prisma errors
      if (dbError?.code?.startsWith('P') && dbError?.code !== 'P2025') {
        redirect('/error?type=database')
      }

      // For other errors, continue without profile (will redirect to home)
      console.warn('Non-database error during profile check, continuing without profile')
    }

    // Log the login activity (in background, don't await)
    logAuthActivity(data.user.id, 'LOGIN').catch(error => {
      console.error('Error logging login activity:', error)
    })

    revalidatePath('/', 'layout')

    // Redirect based on role
    if (profile?.role === 'admin') {
      redirect('/admin')
    } else {
      redirect('/')
    }
  }
}

