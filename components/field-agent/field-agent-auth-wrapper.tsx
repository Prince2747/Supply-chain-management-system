"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { checkFieldAgentRole } from "@/app/[locale]/dashboard/field-agent/actions";
import { useLocale } from "next-intl";

interface FieldAgentAuthWrapperProps {
  children: React.ReactNode;
}

export function FieldAgentAuthWrapper({ children }: FieldAgentAuthWrapperProps) {
  const router = useRouter();
  const supabase = createClient();
  const locale = useLocale();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push(`/${locale}/login`);
        return;
      }

      // Check if user is a field agent using server action
      const isFieldAgent = await checkFieldAgentRole(user.id);
      
      if (!isFieldAgent) {
        router.push(`/${locale}/unauthorized`);
        return;
      }
    };

    checkAccess();
  }, [router, locale]);

  return <>{children}</>;
}
