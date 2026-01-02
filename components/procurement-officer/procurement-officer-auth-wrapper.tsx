"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useLocale } from "next-intl";

interface ProcurementOfficerAuthWrapperProps {
  children: React.ReactNode;
}

export function ProcurementOfficerAuthWrapper({ children }: ProcurementOfficerAuthWrapperProps) {
  const locale = useLocale();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = `/${locale}/login`;
          return;
        }

        // Check user role via API
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profile = await response.json();
        
        if (!['procurement_officer', 'admin', 'manager'].includes(profile.role)) {
          window.location.href = `/${locale}/unauthorized`;
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = `/${locale}/login`;
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [locale]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}