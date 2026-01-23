'use server'

import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') || '').toString().trim()
  const locale = (formData.get('locale') || 'en').toString()

  if (!email) {
    throw new Error('Email is required')
  }

  const origin = headers().get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectTo = `${origin}/${locale}/update-password`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
