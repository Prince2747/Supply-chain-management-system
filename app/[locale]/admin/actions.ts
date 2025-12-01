'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { logAuthActivity } from '@/lib/activity-logger'

export async function logout() {
  const supabase = await createClient()

  // Get user before signing out to log the activity
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error('Error logging out:', error)
    return
  }

  // Log the logout activity if we have the user
  if (user) {
    try {
      await logAuthActivity(user.id, 'LOGOUT')
    } catch (logError) {
      console.error('Error logging logout activity:', logError)
    }
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}
