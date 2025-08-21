"use client";

import { Role } from "@/lib/generated/prisma/client";
import React from "react";
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
  
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <DashboardComponent />
    </div>
  );
}
