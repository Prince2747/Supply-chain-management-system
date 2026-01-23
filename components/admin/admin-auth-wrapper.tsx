import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { getLocale } from "next-intl/server";

interface AdminAuthWrapperProps {
  children: ReactNode;
}

export async function AdminAuthWrapper({ children }: AdminAuthWrapperProps) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const locale = await getLocale();

    // Check if user is authenticated
    if (!user) {
      redirect(`/${locale}/login`);
    }

    // Check if user has admin role
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    if (!profile || profile.role !== "admin") {
      redirect(`/${locale}/unauthorized`);
    }

    return <>{children}</>;
  } catch (error: unknown) {
    const errorObj = error as { code?: string; message?: string; digest?: string };
    const errorCode = typeof errorObj.code === "string" ? errorObj.code : undefined;
    const errorMessage = typeof errorObj.message === "string" ? errorObj.message : "";
    const errorDigest = typeof errorObj.digest === "string" ? errorObj.digest : "";

    // Handle database connection errors specifically
    if (
      errorCode === "P1001" ||
      errorMessage.includes("Can't reach database server") ||
      errorMessage.includes("Connection refused")
    ) {
      console.error("Database connection error in AdminAuthWrapper:", error);
      redirect(`/${locale}/error?type=database`);
    }

    // Handle other Prisma errors that are database-related
    if (errorCode?.startsWith("P") && errorCode !== "P2025") {
      console.error("Database error in AdminAuthWrapper:", error);
      redirect(`/${locale}/error?type=database`);
    }

    // Don't catch redirect errors - let them pass through
    if (errorDigest.includes("NEXT_REDIRECT")) {
      throw error;
    }

    // For other unexpected errors, log and redirect to general error
    console.error("Unexpected error in AdminAuthWrapper:", error);
    redirect(`/${locale}/error?type=general`);
  }
}
