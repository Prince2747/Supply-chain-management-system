import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Send } from "lucide-react";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function ContactPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('contact');
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-green-50">
      <Navigation />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-green-800 py-20 overflow-hidden">
          {/* Subtle pattern + blobs */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-grid-pattern" />
          </div>
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-full text-sm font-semibold mb-6 backdrop-blur-sm">
                <Send className="h-4 w-4" />
                <span>{t('title')}</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
                {t('header.title')}
              </h1>
              <p className="text-green-100 text-lg md:text-xl leading-relaxed">
                {t('header.description')}
              </p>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8">
            {/* Contact Methods */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-green-100 ring-1 ring-green-200 flex items-center justify-center">
                      <Phone className="h-6 w-6 text-green-800" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">{t('callUs.title')}</CardTitle>
                      <CardDescription>{t('info.callDescription')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <a href="tel:+251111275398" className="block text-gray-700 hover:text-green-700 transition-colors">
                    +251 111 275 398
                  </a>
                  <a href="tel:+251924896926" className="block text-gray-700 hover:text-green-700 transition-colors">
                    +251 924 896 926
                  </a>
                  <a href="tel:+251936196382" className="block text-gray-700 hover:text-green-700 transition-colors">
                    +251 936 196 382
                  </a>
                  <a href="tel:+251901946900" className="block text-gray-700 hover:text-green-700 transition-colors">
                    +251 901 946 900
                  </a>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-green-100 ring-1 ring-green-200 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-green-800" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">{t('emailUs.title')}</CardTitle>
                      <CardDescription>{t('info.emailDescription')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <a href="mailto:info@azmerawbekele.com" className="block text-gray-700 hover:text-green-700 transition-colors">
                    info@azmerawbekele.com
                  </a>
                  <a href="mailto:sales@azmerawbekele.com" className="block text-gray-700 hover:text-green-700 transition-colors">
                    sales@azmerawbekele.com
                  </a>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-green-100 ring-1 ring-green-200 flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-green-800" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">{t('visitUs.title')}</CardTitle>
                      <CardDescription>{t('info.visitDescription')}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    Churchill Avenue, Eshetu Mamo Building - F8
                    <br />
                    Office 801
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <Card className="border border-green-100 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-green-600 to-green-400" />
                <CardHeader>
                  <CardTitle className="text-2xl text-gray-900">{t('form.title')}</CardTitle>
                  <CardDescription>{t('form.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.fullName')}
                        </label>
                        <Input
                          id="fullName"
                          name="fullName"
                          type="text"
                          placeholder={t('form.fullNamePlaceholder')}
                          className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.email')}
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder={t('form.emailPlaceholder')}
                          className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.mobile')}
                        </label>
                        <Input
                          id="mobile"
                          name="mobile"
                          type="tel"
                          placeholder={t('form.mobilePlaceholder')}
                          className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                          {t('form.subject')}
                        </label>
                        <Input
                          id="subject"
                          name="subject"
                          type="text"
                          placeholder={t('form.subjectPlaceholder')}
                          className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('form.message')}
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder={t('form.messagePlaceholder')}
                        rows={6}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full bg-green-700 hover:bg-green-800 text-white">
                      <Send className="mr-2 h-4 w-4" />
                      {t('form.sendButton')}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Map */}
          <div className="mt-12 max-w-6xl mx-auto">
            <Card className="border border-green-100 overflow-hidden bg-white/80 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl text-gray-900">{t('map.title')}</CardTitle>
                <CardDescription>{t('map.description')}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full h-[420px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.3165!2d38.7629!3d9.0320!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMDEnNTUuMiJOIDM4wrA0NSc0Ni40IkU!5e0!3m2!1sen!2set!4v1234567890"
                    width="100%"
                    height="420"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 w-full h-full grayscale hover:grayscale-0 transition-all duration-300"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
