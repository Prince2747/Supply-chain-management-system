'use server'

import { createClient } from '@/utils/supabase/server'

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = (formData.get('password') || '').toString()

  if (!password) {
    throw new Error('Password is required')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
