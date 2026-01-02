"use client";

import { LogOut, User, Menu, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { useState } from "react";
import { useLocale } from "next-intl";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const locale = useLocale();

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
                Azmeraw Bekele
              </span>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <LanguageSwitcher />
            <NotificationBell />
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="outline" size="sm" asChild className="text-xs lg:text-sm px-2 lg:px-3">
                <Link href={`/${locale}/profile`}>
                  <User className="h-3.5 w-3.5 lg:h-4 lg:w-4 mr-1.5" />
                  Profile
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = `/${locale}/login`;
                }}
                className="text-gray-700 text-xs lg:text-sm px-2 lg:px-3"
              >
                <LogOut className="h-3.5 w-3.5 lg:h-4 lg:w-4 mr-1.5" />
                Logout
              </Button>
            </div>

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
            <div className="px-3 py-2 space-y-2">
              <Button variant="outline" size="sm" asChild className="w-full justify-start text-xs sm:text-sm">
                <Link href={`/${locale}/profile`} onClick={() => setMobileMenuOpen(false)}>
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                  Profile
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const supabase = createClient();
                  await supabase.auth.signOut();
                  window.location.href = `/${locale}/login`;
                }}
                className="w-full justify-start text-gray-700 text-xs sm:text-sm"
              >
                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>
    </div>
  );
}
