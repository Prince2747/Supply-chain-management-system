"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { checkFieldAgentRole } from "@/app/dashboard/field-agent/actions";

interface FieldAgentAuthWrapperProps {
  children: React.ReactNode;
}

export function FieldAgentAuthWrapper({ children }: FieldAgentAuthWrapperProps) {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is a field agent using server action
      const isFieldAgent = await checkFieldAgentRole(user.id);
      
      if (!isFieldAgent) {
        router.push('/unauthorized');
        return;
      }
    };

    checkAccess();
  }, [router]);

  return <>{children}</>;
}
