"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function TransportDriverAuthWrapper({ children }: AuthWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          router.push("/login");
          return;
        }

        // Check if user has transport_driver role
        const response = await fetch("/api/profile");
        if (response.ok) {
          const profile = await response.json();
          if (profile.role === "transport_driver") {
            setIsAuthorized(true);
          } else {
            router.push("/unauthorized");
            return;
          }
        } else {
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return null; // Let the page skeleton handle loading state
  }

  if (!isAuthorized) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
