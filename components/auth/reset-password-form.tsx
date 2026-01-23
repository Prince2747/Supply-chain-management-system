'use client'

import { useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { requestPasswordReset } from '@/app/[locale]/reset-password/actions'

export function ResetPasswordForm() {
  const t = useTranslations('resetPassword')
  const locale = useLocale()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (formData: FormData) => {
    setError(null)

    const email = (formData.get('email') || '').toString().trim()

    if (!email) {
      const message = t('emailRequired')
      setError(message)
      toast.error(message)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      const message = t('emailInvalid')
      setError(message)
      toast.error(message)
      return
    }

    const sendingToast = toast.loading(t('sending'), {
      description: t('sendingDescription')
    })

    startTransition(async () => {
      try {
        await requestPasswordReset(formData)

        toast.success(t('emailSent'), {
          description: t('checkInbox'),
          id: sendingToast,
          duration: 4000,
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : t('error')
        setError(errorMessage)
        toast.error(t('sendFailed'), {
          description: errorMessage,
          id: sendingToast,
          duration: 4000,
        })
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          required
          disabled={isPending}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t('sendingButton')}
          </>
        ) : (
          t('sendLink')
        )}
      </Button>

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
    </form>
  )
}
