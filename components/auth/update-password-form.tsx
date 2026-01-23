'use client'

import { useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { updatePassword } from '@/app/[locale]/update-password/actions'

export function UpdatePasswordForm() {
  const t = useTranslations('updatePassword')
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setError(null)

    const password = (formData.get('password') || '').toString()
    const confirmPassword = (formData.get('confirmPassword') || '').toString()

    if (!password) {
      const message = t('passwordRequired')
      setError(message)
      toast.error(message)
      return
    }

    if (password.length < 8) {
      const message = t('passwordTooShort')
      setError(message)
      toast.error(message)
      return
    }

    if (!confirmPassword) {
      const message = t('confirmRequired')
      setError(message)
      toast.error(message)
      return
    }

    if (password !== confirmPassword) {
      const message = t('passwordsMismatch')
      setError(message)
      toast.error(message)
      return
    }

    const updatingToast = toast.loading(t('updating'), {
      description: t('updatingDescription')
    })

    startTransition(async () => {
      try {
        await updatePassword(formData)

        toast.success(t('updatedSuccess'), {
          description: t('updatedDescription'),
          id: updatingToast,
          duration: 3000,
        })

        setTimeout(() => {
          router.push(`/${locale}/login`)
        }, 1500)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('error')
        setError(errorMessage)
        toast.error(t('updateFailed'), {
          description: errorMessage,
          id: updatingToast,
          duration: 4000,
        })
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{t('newPassword')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={t('newPasswordPlaceholder')}
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder={t('confirmPasswordPlaceholder')}
          required
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('updatingButton')}
          </>
        ) : (
          t('updateButton')
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </form>
  )
}
