import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { AnimatedGlobe } from "@/components/animated-globe";
import { ProductImage } from "@/components/product-image";
import { ParallaxSection, ParallaxLayer } from "@/components/parallax-section";
import { Button } from "@/components/ui/button";
import { getTranslations } from 'next-intl/server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle,
  Globe,
  Shield,
  Truck,
  Users,
  Package,
  Zap,
  Award,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const t = await getTranslations('hero');
  const tHome = await getTranslations('home');
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-green-50/30 py-24 md:py-32">
        {/* Animated background elements with parallax */}
        <ParallaxLayer speed={0.2} className="opacity-30">
          <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-green-200/40 rounded-full blur-3xl animate-pulse" />
        </ParallaxLayer>
        <ParallaxLayer speed={0.15} className="opacity-30">
          <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-green-100/30 rounded-full blur-3xl animate-pulse delay-1000" />
        </ParallaxLayer>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ParallaxSection speed={0.1}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Text content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in-down">
                <Award className="h-4 w-4" />
                <span>{t('badge')}</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-gray-900 mb-6 animate-fade-in">
                {t('companyName')}
                <span className="block text-green-700 mt-2 bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                  {t('companyType')}
                </span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-3xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up">
                {t('description')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center animate-fade-in-up delay-200">
                <Link href="/login" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto group bg-green-700 hover:bg-green-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    {t('employeePortal')}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/about" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto border-2 border-green-700 text-green-700 hover:bg-green-50 transition-all duration-300 hover:scale-105"
                  >
                    {t('learnMore')}
                  </Button>
                </Link>
              </div>

              {/* Company stats */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center lg:text-left animate-fade-in-up delay-300">
                  <div className="text-3xl md:text-4xl font-bold text-green-700 mb-1">13+</div>
                  <div className="text-sm text-gray-600">{t('yearsExperience')}</div>
                </div>
                <div className="text-center lg:text-left animate-fade-in-up delay-400">
                  <div className="text-3xl md:text-4xl font-bold text-green-700 mb-1">50+</div>
                  <div className="text-sm text-gray-600">{t('countriesServed')}</div>
                </div>
                <div className="text-center lg:text-left animate-fade-in-up delay-500">
                  <div className="text-3xl md:text-4xl font-bold text-green-700 mb-1">500+</div>
                  <div className="text-sm text-gray-600">{t('satisfiedCustomers')}</div>
                </div>
                <div className="text-center lg:text-left animate-fade-in-up delay-600">
                  <div className="text-3xl md:text-4xl font-bold text-green-700 mb-1">300+</div>
                  <div className="text-sm text-gray-600">{t('employees')}</div>
                </div>
              </div>
            </div>

            {/* Right side - Animated Globe */}
            <div className="hidden lg:flex justify-center items-center animate-fade-in delay-300">
              <div className="w-full max-w-md">
                <AnimatedGlobe />
              </div>
            </div>
          </div>
          </ParallaxSection>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              {tHome('features.badge')}
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-4">
              {tHome('features.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {tHome('features.description')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Export Products */}
            <Card className="text-center border-2 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-8 w-8 text-green-700" />
                </div>
                <CardTitle className="text-xl mb-2">{tHome('features.oilSeeds.title')}</CardTitle>
                <CardDescription className="text-base">
                  {tHome('features.oilSeeds.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Coffee & Beans */}
            <Card className="text-center border-2 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-8 w-8 text-green-700" />
                </div>
                <CardTitle className="text-xl mb-2">{tHome('features.coffee.title')}</CardTitle>
                <CardDescription className="text-base">
                  {tHome('features.coffee.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Pulses & Spices */}
            <Card className="text-center border-2 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-8 w-8 text-green-700" />
                </div>
                <CardTitle className="text-xl mb-2">{tHome('features.pulses.title')}</CardTitle>
                <CardDescription className="text-base">
                  {tHome('features.pulses.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Import - Machinery */}
            <Card className="text-center border-2 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Package className="h-8 w-8 text-green-700" />
                </div>
                <CardTitle className="text-xl mb-2">{tHome('features.machinery.title')}</CardTitle>
                <CardDescription className="text-base">
                  {tHome('features.machinery.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Import - Steel & Materials */}
            <Card className="text-center border-2 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-8 w-8 text-green-700" />
                </div>
                <CardTitle className="text-xl mb-2">{tHome('features.steel.title')}</CardTitle>
                <CardDescription className="text-base">
                  {tHome('features.steel.description')}
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Tyres & Automotive */}
            <Card className="text-center border-2 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Truck className="h-8 w-8 text-green-700" />
                </div>
                <CardTitle className="text-xl mb-2">{tHome('features.tyres.title')}</CardTitle>
                <CardDescription className="text-base">
                  {tHome('features.tyres.description')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Showcase with Images */}
      <section className="py-24 bg-gradient-to-br from-green-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ParallaxSection speed={0.15}>
          <div className="text-center mb-16">
            <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              {tHome('products.badge')}
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900 mb-4">
              {tHome('products.title')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {tHome('products.description')}
            </p>
          </div>
          </ParallaxSection>

          {/* Image Grid */}
          <ParallaxSection speed={0.08}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Coffee Beans */}
            <ProductImage
              src="/images/products/coffee-beans.jpg"
              alt="Ethiopian Coffee Beans - Yirgacheffe, Lekempti, Jimma Grade"
              title="Ethiopian Coffee"
              subtitle="Yirgacheffe, Lekempti & Jimma Grade"
              fallbackIcon="☕"
              gradientFrom="amber-100"
              gradientTo="amber-50"
            />

            {/* Oil Seeds */}
            <ProductImage
              src="/images/products/sesame-seeds.jpg"
              alt="Oil Seeds - Sesame, Niger Seeds, Soybeans"
              title="Premium Oil Seeds"
              subtitle="Sesame, Niger Seeds & Soybeans"
              fallbackIcon="🌾"
              gradientFrom="yellow-100"
              gradientTo="yellow-50"
            />

            {/* Pulses */}
            <ProductImage
              src="/images/products/pulses.jpg"
              alt="Pulses - Green Mung, Red Kidney Beans"
              title="Quality Pulses"
              subtitle="Green Mung & Red Kidney Beans"
              fallbackIcon="🫘"
              gradientFrom="red-100"
              gradientTo="red-50"
            />

            {/* Machinery */}
            <ProductImage
              src="/images/products/machinery.jpg"
              alt="Industrial Machinery and Equipment"
              title="Industrial Machinery"
              subtitle="Advanced Equipment & Technology"
              fallbackIcon="⚙️"
              gradientFrom="gray-200"
              gradientTo="gray-100"
            />

            {/* Tyres */}
            <ProductImage
              src="/images/products/tyres.jpg"
              alt="Tyres and Automotive Products"
              title="Premium Tyres"
              subtitle="Quality Automotive & Industrial Tyres"
              fallbackIcon="�"
              gradientFrom="blue-100"
              gradientTo="blue-50"
            />

            {/* Steel Bars */}
            <ProductImage
              src="/images/products/steel-bars.jpg"
              alt="Steel Bars and Construction Materials"
              title="Steel Bars"
              subtitle="Construction Grade Materials"
              fallbackIcon="🏗️"
              gradientFrom="slate-200"
              gradientTo="slate-100"
            />
          </div>
          </ParallaxSection>
        </div>
      </section>

      {/* Services Section */}
      <section className="relative py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50/30 overflow-hidden">
        {/* Background decoration with parallax */}
        <ParallaxLayer speed={0.1} className="opacity-5">
          <div className="absolute inset-0 bg-grid-pattern" />
        </ParallaxLayer>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ParallaxSection speed={0.12}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-2">
                {tHome('whyChooseUs.badge')}
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-gray-900">
                {tHome('whyChooseUs.title')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                {tHome('whyChooseUs.description')}
              </p>

              <div className="space-y-4 pt-4">
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <CheckCircle className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{tHome('whyChooseUs.exportExcellence.title')}</h3>
                    <p className="text-sm text-gray-600">{tHome('whyChooseUs.exportExcellence.description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <CheckCircle className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{tHome('whyChooseUs.importOperations.title')}</h3>
                    <p className="text-sm text-gray-600">{tHome('whyChooseUs.importOperations.description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <CheckCircle className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{tHome('whyChooseUs.manufacturing.title')}</h3>
                    <p className="text-sm text-gray-600">{tHome('whyChooseUs.manufacturing.description')}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <CheckCircle className="h-5 w-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{tHome('whyChooseUs.diversified.title')}</h3>
                    <p className="text-sm text-gray-600">{tHome('whyChooseUs.diversified.description')}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/about">
                  <Button size="lg" variant="outline" className="group border-2 border-green-700 text-green-700 hover:bg-green-50">
                    {tHome('whyChooseUs.discoverButton')}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Card className="p-8 text-center bg-gradient-to-br from-white to-green-50/30 border-2 hover:border-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="mb-4 mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-green-700" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-green-700 mb-2">
                  20M
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {tHome('whyChooseUs.stats.capital')}
                </div>
              </Card>
              
              <Card className="p-8 text-center bg-gradient-to-br from-white to-green-50/30 border-2 hover:border-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-lg mt-8">
                <div className="mb-4 mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-700" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-green-700 mb-2">
                  300+
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {tHome('whyChooseUs.stats.employees')}
                </div>
              </Card>
              
              <Card className="p-8 text-center bg-gradient-to-br from-white to-green-50/30 border-2 hover:border-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="mb-4 mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-green-700" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-green-700 mb-2">
                  11+
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {tHome('whyChooseUs.stats.productCategories')}
                </div>
              </Card>
              
              <Card className="p-8 text-center bg-gradient-to-br from-white to-green-50/30 border-2 hover:border-green-500/30 transition-all duration-300 hover:scale-105 hover:shadow-lg mt-8">
                <div className="mb-4 mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Globe className="h-6 w-6 text-green-700" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-green-700 mb-2">
                  6+
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {tHome('whyChooseUs.stats.businessSectors')}
                </div>
              </Card>
            </div>
          </div>
          </ParallaxSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-green-700 via-green-600 to-green-700 text-white overflow-hidden">
        {/* Animated background elements with parallax */}
        <ParallaxLayer speed={0.3} className="overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
        </ParallaxLayer>
        <ParallaxLayer speed={0.25} className="overflow-hidden">
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </ParallaxLayer>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ParallaxSection speed={0.15}>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Award className="h-4 w-4" />
            <span>{tHome('cta.badge')}</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mb-6">
            {tHome('cta.title')}
          </h2>
          
          <p className="text-lg md:text-xl mb-10 opacity-90 max-w-3xl mx-auto leading-relaxed">
            {tHome('cta.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a href="tel:+251111275398" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto group bg-white text-green-700 hover:bg-gray-100 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              >
                <Users className="mr-2 h-5 w-5" />
                {tHome('cta.contactButton')}
              </Button>
            </a>
            <a href="mailto:info@azmerawbekele.com" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/50 text-white hover:bg-white/10 transition-all duration-300 hover:scale-105 backdrop-blur-sm"
              >
                {tHome('cta.emailButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>

          {/* Contact Information */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto opacity-90">
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-1">
                <Users className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">{tHome('cta.contact.phone')}</span>
              <span className="text-xs">+251 111 275 398<br/>+251 924 896 926</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-1">
                <Globe className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">{tHome('cta.contact.email')}</span>
              <span className="text-xs">info@azmerawbekele.com</span>
            </div>
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-1">
                <Package className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium">{tHome('cta.contact.location')}</span>
              <span className="text-xs">Churchill Avenue<br/>Eshetu Mamo Building - F8 Office 801</span>
            </div>
          </div>
          </ParallaxSection>
        </div>
      </section>

      <Footer />
    </div>
  );
}
