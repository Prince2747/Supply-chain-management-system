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
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      {/* Header Section */}
      <div className="bg-green-700 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4">
            {t('header.title')}
          </h1>
          <p className="text-center text-green-100 max-w-2xl mx-auto">
            {t('header.description')}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="space-y-6">
            {/* Call Us Card */}
            <Card className="border-green-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Phone className="h-6 w-6 text-green-700" />
                  </div>
                  <CardTitle className="text-2xl text-green-700">{t('callUs.title')}</CardTitle>
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

            {/* Email Us Card */}
            <Card className="border-green-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Mail className="h-6 w-6 text-green-700" />
                  </div>
                  <CardTitle className="text-2xl text-green-700">{t('emailUs.title')}</CardTitle>
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

            {/* Visit Us Card */}
            <Card className="border-green-200 hover:shadow-lg transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-3 rounded-full">
                    <MapPin className="h-6 w-6 text-green-700" />
                  </div>
                  <CardTitle className="text-2xl text-green-700">{t('visitUs.title')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Churchill Avenue, Eshetu Mamo Building - F8<br />
                  Office 801
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="border-green-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">{t('form.title')}</CardTitle>
              <CardDescription>
                {t('form.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
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

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    {t('form.message')}
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder={t('form.messagePlaceholder')}
                    rows={5}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-green-700 hover:bg-green-800 text-white"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {t('form.sendButton')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Map Section */}
        <div className="mt-16 max-w-6xl mx-auto">
          <Card className="border-green-200 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-2xl text-green-700">{t('map.title')}</CardTitle>
              <CardDescription>
                {t('map.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full h-[400px] bg-gray-200 flex items-center justify-center">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3940.3165!2d38.7629!3d9.0320!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMDEnNTUuMiJOIDM4wrA0NSc0Ni40IkU!5e0!3m2!1sen!2set!4v1234567890"
                  width="100%"
                  height="400"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-300"
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
