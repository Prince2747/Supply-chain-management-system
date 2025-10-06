import { ReactNode } from "react";
import { AdminAuthWrapper } from "@/components/admin/admin-auth-wrapper";
import { AdminLayout } from "@/components/admin/admin-layout";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminRootLayout({ children }: AdminLayoutProps) {
  return (
    <AdminAuthWrapper>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminAuthWrapper>
  );
}