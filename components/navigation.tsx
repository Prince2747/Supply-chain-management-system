"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from 'next-intl';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Menu, X, Home as HomeIcon, Info, LogIn, Phone } from "lucide-react";
import { useState } from "react";
import { LanguageSwitcher } from "./language-switcher";

export function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const locale = useLocale();

  const navigation = [
    { name: t('home'), href: `/${locale}`, icon: HomeIcon },
    { name: t('about'), href: `/${locale}/about`, icon: Info },
    { name: t('contact'), href: `/${locale}/contact`, icon: Phone },
  ];

  return (
    <>
      {/* Top Info Bar */}
      <div className="bg-gray-100 border-b border-gray-200 py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-gray-600">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-xs sm:text-sm">
                  {t('address')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                <span className="text-xs sm:text-sm">{t('email')}</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-xs text-gray-500">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span>{t('systemOnline')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation - Admin Dashboard Style */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-8">
              <Link href={`/${locale}`} className="flex items-center space-x-2">
                <img src="/logo.png" alt="Company Logo" className="h-8 w-auto" />
                <span className="text-lg font-semibold text-gray-900">
                  {t('companyName')}
                </span>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden md:flex items-center space-x-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center space-x-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-green-100 text-green-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right side - Login button and mobile menu */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Link href={`/${locale}/login`} className="hidden md:block">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  {t('login')}
                </Button>
              </Link>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-4 py-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium",
                        isActive
                          ? "bg-green-100 text-green-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                {/* Mobile login */}
                <div className="pt-2 border-t border-gray-100">
                  <Link
                    href={`/${locale}/login`}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>{t('login')}</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
