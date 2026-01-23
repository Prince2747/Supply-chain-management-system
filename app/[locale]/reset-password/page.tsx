import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ResetPasswordForm } from '@/components/auth/reset-password-form'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

interface ResetPasswordPageProps {
  params: Promise<{ locale: string }>
}

export default async function ResetPasswordPage({ params }: ResetPasswordPageProps) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('resetPassword')

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
            <CardContent>
              <ResetPasswordForm />
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
