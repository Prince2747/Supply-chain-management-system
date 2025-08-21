import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

interface AdminAuthWrapperProps {
  children: ReactNode;
}

export async function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if user is authenticated
    if (!user) {
      redirect("/login");
    }

    // Check if user has admin role
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || profile.role !== "admin") {
      redirect("/unauthorized");
    }

    return <>{children}</>;
  } catch (error: any) {
    // Handle database connection errors specifically
    if (
      error?.code === "P1001" ||
      error?.message?.includes("Can't reach database server") ||
      error?.message?.includes("Connection refused")
    ) {
      console.error("Database connection error in AdminAuthWrapper:", error);
      redirect("/error?type=database");
    }

    // Handle other Prisma errors that are database-related
    if (error?.code?.startsWith("P") && error?.code !== "P2025") {
      console.error("Database error in AdminAuthWrapper:", error);
      redirect("/error?type=database");
    }

    // Don't catch redirect errors - let them pass through
    if (error?.digest?.includes("NEXT_REDIRECT")) {
      throw error;
    }

    // For other unexpected errors, log and redirect to general error
    console.error("Unexpected error in AdminAuthWrapper:", error);
    redirect("/error?type=general");
  }
}
