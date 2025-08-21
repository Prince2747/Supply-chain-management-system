"use client";

import { Role } from "@/lib/generated/prisma/client";
import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ManagerDashboard } from "./role-dashboards/manager-dashboard";
import { FieldAgentDashboard } from "./role-dashboards/field-agent-dashboard";
import { ProcurementOfficerDashboard } from "./role-dashboards/procurement-officer-dashboard";
import { WarehouseManagerDashboard } from "./role-dashboards/warehouse-manager-dashboard";
import { TransportDriverDashboard } from "./role-dashboards/transport-driver-dashboard";

interface DashboardProps {
  userRole: Role;
}

const ROLE_DASHBOARDS: Record<Role, () => React.ReactElement> = {
  admin: () => <div>Admin Dashboard</div>,
  manager: () => <ManagerDashboard />,
  field_agent: () => <FieldAgentDashboard />,
  procurement_officer: () => <ProcurementOfficerDashboard />,
  warehouse_manager: () => <WarehouseManagerDashboard />,
  transport_driver: () => <TransportDriverDashboard />
};

export function Dashboard({ userRole }: DashboardProps) {
  const DashboardComponent = ROLE_DASHBOARDS[userRole] || ROLE_DASHBOARDS.admin;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar - Supabase Style */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Company Logo" className="h-8 w-auto" />
              <span className="text-lg font-semibold text-gray-900">
                Supply Chain Management
              </span>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="text-gray-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DashboardComponent />
        </div>
      </main>
    </div>
  );
}
