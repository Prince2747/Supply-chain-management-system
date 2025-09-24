"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface WarehouseManagerAuthWrapperProps {
  children: React.ReactNode;
}

export function WarehouseManagerAuthWrapper({ children }: WarehouseManagerAuthWrapperProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          window.location.href = '/login';
          return;
        }

        // Check user role via API
        const response = await fetch('/api/profile');
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profile = await response.json();
        
        if (profile.role !== 'warehouse_manager') {
          window.location.href = '/unauthorized';
          return;
        }

        // Server-side page components will handle warehouse assignment check
        // This avoids race conditions between client and server redirects
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login';
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8 p-8">
        {/* Header Skeleton */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 w-80 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-5 w-60 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border rounded-lg p-6 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>

        {/* Content Area Skeleton */}
        <div className="grid gap-8 md:grid-cols-2">
          <div className="border rounded-lg p-6 space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className="border rounded-lg p-6 space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  return <>{children}</>;
}