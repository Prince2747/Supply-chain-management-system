import { AdminAuthWrapper } from "@/components/admin/admin-auth-wrapper";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Role } from "@/lib/generated/prisma/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  UserPlus,
  Shield,
  Activity,
  Warehouse,
  Ruler,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

async function getDashboardStats() {
  const supabase = await createClient();

  // Get total users count
  const totalUsers = await prisma.profile.count();

  // Get users count by role
  const adminUsers = await prisma.profile.count({
    where: { role: Role.admin },
  });

  const staffUsers = await prisma.profile.count({
    where: { 
      role: {
        in: [
          Role.manager,
          Role.field_agent,
          Role.procurement_officer,
          Role.warehouse_manager,
          Role.transport_driver
        ]
      }
    },
  });

  // Get recent users (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentUsers = await prisma.profile.count({
    where: {
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  });

  // Get warehouse stats
  const totalWarehouses = await prisma.warehouse.count();
  const activeWarehouses = await prisma.warehouse.count({
    where: { isActive: true },
  });

  // Get units stats
  const totalUnits = await prisma.unitOfMeasurement.count();
  const activeUnits = await prisma.unitOfMeasurement.count({
    where: { isActive: true },
  });

  // Get recent activity (last 24 hours)
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const recentActivity = await prisma.activityLog.count({
    where: {
      createdAt: {
        gte: twentyFourHoursAgo,
      },
    },
  });

  return {
    totalUsers,
    adminUsers,
    staffUsers,
    recentUsers,
    totalWarehouses,
    activeWarehouses,
    totalUnits,
    activeUnits,
    recentActivity,
  };
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <AdminAuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Overview of your application's user management
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <img src="/logo.png" alt="Company Logo" className="h-6 w-6 object-contain" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.adminUsers} admins, {stats.staffUsers} staff members
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Warehouses
                </CardTitle>
                <Warehouse className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.activeWarehouses}
                </div>
                <p className="text-xs text-muted-foreground">
                  Out of {stats.totalWarehouses} total warehouses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Units of Measurement
                </CardTitle>
                <Ruler className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUnits}</div>
                <p className="text-xs text-muted-foreground">
                  Active measurement units
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Recent Activity
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentActivity}</div>
                <p className="text-xs text-muted-foreground">
                  Actions in last 24 hours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <a
                  href="/admin/users"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </a>
                <a
                  href="/admin/warehouses"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Warehouse className="mr-2 h-4 w-4" />
                  Manage Warehouses
                </a>
                <a
                  href="/admin/units"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Ruler className="mr-2 h-4 w-4" />
                  Manage Units
                </a>
                <a
                  href="/admin/logs"
                  className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  View Activity Logs
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminAuthWrapper>
  );
}
