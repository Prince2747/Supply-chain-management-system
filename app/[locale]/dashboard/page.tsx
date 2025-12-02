import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

const ROLE_ROUTES = {
  manager: "/dashboard/manager",
  field_agent: "/dashboard/field-agent",
  procurement_officer: "/dashboard/procurement-officer",
  warehouse_manager: "/dashboard/warehouse-manager",
  transport_driver: "/dashboard/transport-driver",
  transport_coordinator: "/dashboard/transport-coordinator",
  admin: "/admin"
};

async function getUserRole(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { role: true }
  });
  return profile?.role;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();
  
  if (!user) {
    redirect(`/${locale}/login`);
  }

  const role = await getUserRole(user.id);

  if (!role) {
    redirect(`/${locale}/unauthorized`);
  }

  // Redirect to role-specific dashboard
  const roleRoute = ROLE_ROUTES[role as keyof typeof ROLE_ROUTES];
  if (roleRoute) {
    redirect(`/${locale}${roleRoute}`);
  }

  return (
    <main className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="animate-pulse">Loading...</div>
      </div>
    </main>
  );
}
