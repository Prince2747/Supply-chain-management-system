"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Users,
  Settings,
  BarChart3,
  Shield,
  LogOut,
  Menu,
  X,
  Warehouse,
  Ruler,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/[locale]/admin/actions";
import { LanguageSwitcher } from "@/components/language-switcher";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('admin');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define navigation with translation keys
  const navigation = [
    { name: t('dashboard'), href: "/admin", icon: BarChart3 },
    { name: t('users'), href: "/admin/users", icon: Users },
    { name: t('warehouses'), href: "/admin/warehouses", icon: Warehouse },
    { name: t('units'), href: "/admin/units", icon: Ruler },
    { name: t('activityLogs'), href: "/admin/logs", icon: Activity },
    { name: t('settings'), href: "/admin/settings", icon: Settings },
  ];

  // Create locale-aware navigation links
  const localizedNav = navigation.map(item => ({
    ...item,
    href: `/${locale}${item.href}`
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar - Supabase Style */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4 sm:space-x-8">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <img src="/logo.png" alt="Company Logo" className="h-6 sm:h-8 w-auto" />
              <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none">
                {t('adminDashboard')}
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-0.5 lg:space-x-1">
              {localizedNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1.5 rounded-md px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-medium transition-colors",
                      isActive
                        ? "bg-green-100 text-green-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side - Language switcher, logout, and mobile menu */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcher />

            <form action={logout} className="hidden md:block">
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 text-xs lg:text-sm px-2 lg:px-3"
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5 lg:h-4 lg:w-4" />
                {t('logout')}
              </Button>
            </form>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-3 py-2 space-y-1">
              {localizedNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-2 rounded-md px-3 py-2 text-xs sm:text-sm font-medium",
                      isActive
                        ? "bg-green-100 text-green-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile language switcher and logout */}
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="px-3">
                  <LanguageSwitcher />
                </div>
                <form action={logout}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
                  >
                    <LogOut className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {t('logout')}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="p-6 lg:p-8">{children}</main>
    </div>
  );
}
