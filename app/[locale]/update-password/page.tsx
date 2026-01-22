import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { UpdatePasswordForm } from '@/components/auth/update-password-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

interface UpdatePasswordPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ code?: string; error?: string; error_description?: string }>
}

export default async function UpdatePasswordPage({ params, searchParams }: UpdatePasswordPageProps) {
  const { locale } = await params
  const { code, error, error_description } = await searchParams

  setRequestLocale(locale)
  const t = await getTranslations('updatePassword')

  let exchangeError: string | null = null

  if (code) {
    const supabase = await createClient()
    const { error: exchangeErrorObj } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeErrorObj) {
      exchangeError = exchangeErrorObj.message
    }
  } else if (error) {
    exchangeError = error_description || error
  }

  const canUpdate = Boolean(code) && !exchangeError

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 flex items-center justify-center py-12 bg-gradient-to-br from-green-50 to-green-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-grid-pattern animate-slide-down"></div>
        </div>

        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-pattern animate-slide-up"></div>
        </div>

        <div className="absolute top-20 left-20 w-32 h-32 bg-green-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-green-400/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-green-200/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>

        <div className="w-full max-w-md px-4 relative z-10">
          <Card className="shadow-2xl border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-green-700">{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!canUpdate && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {exchangeError || t('missingLink')}
                </div>
              )}

              {canUpdate ? (
                <UpdatePasswordForm />
              ) : (
                <Link href={`/${locale}/reset-password`} className="text-sm text-green-700 hover:underline">
                  {t('backToReset')}
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
