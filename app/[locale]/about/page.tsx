import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { AnimatedTree } from "@/components/animated-tree";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, Globe, Shield, Truck, Users, Target, TrendingUp, Heart, Zap, ArrowRight, CheckCircle } from "lucide-react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}));
}

export default async function AboutPage({
  params
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  const t = await getTranslations('about');
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-green-800 py-24 overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-grid-pattern"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in-up">
              {t('hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-3xl mx-auto animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              {t('hero.description')}
            </p>
            <div className="flex justify-center gap-4 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              <Button size="lg" variant="secondary" className="bg-white text-green-700 hover:bg-green-50">
                {t('hero.button')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </section>

      {/* Company Story */}
      <section className="py-20 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-6">
                {t('story.badge')}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {t('story.title')}
              </h2>
              <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
                <p>
                  {t('story.paragraph1')}
                </p>
                <p>
                  {t('story.paragraph2')}
                </p>
                <p>
                  {t('story.paragraph3')}
                </p>
              </div>
              
              {/* Key highlights */}
              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">{t('story.highlights.iso.title')}</div>
                    <div className="text-sm text-gray-600">{t('story.highlights.iso.description')}</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">{t('story.highlights.global.title')}</div>
                    <div className="text-sm text-gray-600">{t('story.highlights.global.description')}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <Card className="text-center p-8 border-2 border-green-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-green-50">
                <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">13+</div>
                <div className="text-sm font-medium text-gray-600">{t('story.stats.experience')}</div>
              </Card>
              <Card className="text-center p-8 border-2 border-green-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-green-50">
                <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">500+</div>
                <div className="text-sm font-medium text-gray-600">{t('story.stats.clients')}</div>
              </Card>
              <Card className="text-center p-8 border-2 border-green-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-green-50">
                <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">50+</div>
                <div className="text-sm font-medium text-gray-600">{t('story.stats.countries')}</div>
              </Card>
              <Card className="text-center p-8 border-2 border-green-200 hover:border-green-400 hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-br from-white to-green-50">
                <div className="text-5xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-2">300+</div>
                <div className="text-sm font-medium text-gray-600">{t('story.stats.employees')}</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('mission.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t('mission.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Mission */}
            <div className="opacity-0 translate-y-8 animate-fade-in-up" style={{animationDelay: '0.1s', animationFillMode: 'forwards'}}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{t('mission.missionTitle')}</h3>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                {t('mission.missionDescription')}
              </p>
            </div>

            {/* Vision */}
            <div className="opacity-0 translate-y-8 animate-fade-in-up" style={{animationDelay: '0.3s', animationFillMode: 'forwards'}}>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-2xl flex items-center justify-center shadow-lg">
                  <Globe className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{t('mission.visionTitle')}</h3>
              </div>
              <p className="text-gray-700 text-lg leading-relaxed">
                {t('mission.visionDescription')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Growth & Sustainability Section with Animated Tree */}
      <section className="py-20 bg-gradient-to-br from-green-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Animated Tree */}
            <div className="order-2 lg:order-1 animate-fade-in">
              <Card className="border-2 border-gray-200 bg-white p-8 shadow-lg">
                <AnimatedTree />
              </Card>
            </div>

            {/* Growth Content */}
            <div className="order-1 lg:order-2 animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-6">
                {t('growth.badge')}
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                {t('growth.title')}
              </h2>
              <div className="space-y-4 text-lg text-gray-700 leading-relaxed">
                <p>
                  {t('growth.paragraph1')}
                </p>
                <p>
                  {t('growth.paragraph2')}
                </p>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-green-200">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-green-700" />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Continuous Growth</div>
                      <div className="text-sm text-gray-600">Year over year expansion</div>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-white rounded-lg border border-green-200">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Heart className="h-5 w-5 text-green-700" />
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">Community Impact</div>
                      <div className="text-sm text-gray-600">Supporting local farmers</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="relative py-20 bg-gradient-to-b from-green-50 to-white overflow-hidden">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-green-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-green-100/40 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur-sm border border-green-200 text-green-800 rounded-full text-sm font-semibold mb-6">
              <Shield className="h-4 w-4" />
              <span>{t('values.badge')}</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('values.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('values.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 ring-1 ring-green-200 group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300">
                  <Shield className="h-7 w-7 text-green-800" />
                </div>
                <CardTitle className="text-lg md:text-xl mb-2">{t('values.integrity.title')}</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  {t('values.integrity.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 ring-1 ring-green-200 group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300">
                  <Award className="h-7 w-7 text-green-800" />
                </div>
                <CardTitle className="text-lg md:text-xl mb-2">{t('values.excellence.title')}</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  {t('values.excellence.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 ring-1 ring-green-200 group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300">
                  <Zap className="h-7 w-7 text-green-800" />
                </div>
                <CardTitle className="text-lg md:text-xl mb-2">{t('values.innovation.title')}</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  {t('values.innovation.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 ring-1 ring-green-200 group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300">
                  <Users className="h-7 w-7 text-green-800" />
                </div>
                <CardTitle className="text-lg md:text-xl mb-2">{t('values.partnership.title')}</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  {t('values.partnership.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 ring-1 ring-green-200 group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300">
                  <Globe className="h-7 w-7 text-green-800" />
                </div>
                <CardTitle className="text-lg md:text-xl mb-2">{t('values.globalReach.title')}</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  {t('values.globalReach.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 ring-1 ring-green-200 group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300">
                  <Truck className="h-7 w-7 text-green-800" />
                </div>
                <CardTitle className="text-lg md:text-xl mb-2">{t('values.reliability.title')}</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  {t('values.reliability.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 ring-1 ring-green-200 group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300">
                  <Heart className="h-7 w-7 text-green-800" />
                </div>
                <CardTitle className="text-lg md:text-xl mb-2">{t('values.customerFocus.title')}</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  {t('values.customerFocus.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group relative overflow-hidden border border-green-100 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-600 to-green-400" />
              <CardHeader className="text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-4 ring-1 ring-green-200 group-hover:scale-110 group-hover:bg-green-200 transition-all duration-300">
                  <TrendingUp className="h-7 w-7 text-green-800" />
                </div>
                <CardTitle className="text-lg md:text-xl mb-2">{t('values.growth.title')}</CardTitle>
                <CardDescription className="text-sm md:text-base">
                  {t('values.growth.description')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
