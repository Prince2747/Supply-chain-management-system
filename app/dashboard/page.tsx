import { Dashboard } from "@/components/dashboard/dashboard";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

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
  
  if (!user) {
    redirect('/login');
  }

  const role = await getUserRole(user.id);

  if (!role) {
    redirect('/unauthorized');
  }

  return (
    <main className="flex-1 space-y-4 p-8 pt-6">
      <Dashboard userRole={role} />
    </main>
  );
}
