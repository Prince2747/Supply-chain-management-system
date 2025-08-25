import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function TransportCoordinatorAuthWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Check if user has transport coordinator role
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile || profile.role !== "transport_coordinator") {
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
