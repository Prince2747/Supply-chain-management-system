import { Suspense } from "react";
import { AdminAuthWrapper } from "@/components/admin/admin-auth-wrapper";
import { AdminLayout } from "@/components/admin/admin-layout";
import { UserManagement } from "@/components/admin/user-management";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function UserManagementSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminAuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              User Management
            </h2>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>

          <Suspense fallback={<UserManagementSkeleton />}>
            <UserManagement />
          </Suspense>
        </div>
      </AdminLayout>
    </AdminAuthWrapper>
  );
}
