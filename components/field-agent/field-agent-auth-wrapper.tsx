"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Role } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";

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

      // Check if user is a field agent in Prisma
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true }
      });

      if (!profile || profile.role !== Role.field_agent) {
        router.push('/unauthorized');
        return;
      }
    };

    checkAccess();
  }, [router]);

  return <>{children}</>;
}
