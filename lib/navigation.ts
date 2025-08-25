import { Role } from "@/lib/generated/prisma/client";

export const ROLE_REDIRECTS: Record<Role, string> = {
  admin: '/admin',
  manager: '/dashboard',
  field_agent: '/dashboard',
  procurement_officer: '/dashboard',
  warehouse_manager: '/dashboard',
  transport_driver: '/dashboard',
  transport_coordinator: '/dashboard/transport-coordinator'
};

export function getRoleBasedRedirectPath(role: Role): string {
  return ROLE_REDIRECTS[role] || '/unauthorized';
}

interface RoleNavigation {
  label: string;
  items: {
    title: string;
    href: string;
    description?: string;
  }[];
}

export const ROLE_NAVIGATION: Record<Role, RoleNavigation> = {
  admin: {
    label: "Admin",
    items: [
      {
        title: "Dashboard",
        href: "/admin",
        description: "System overview and management"
      },
      {
        title: "Users",
        href: "/admin/users",
        description: "Manage system users"
      },
      {
        title: "Settings",
        href: "/admin/settings",
        description: "System configuration"
      }
    ]
  },
  manager: {
    label: "Manager",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        description: "Overview and analytics"
      },
      {
        title: "Reports",
        href: "/reports",
        description: "View and generate reports"
      },
      {
        title: "Team Management",
        href: "/team",
        description: "Manage team members"
      }
    ]
  },
  field_agent: {
    label: "Field Agent",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        description: "Your tasks and assignments"
      },
      {
        title: "Field Reports",
        href: "/field-reports",
        description: "Submit and view reports"
      }
    ]
  },
  procurement_officer: {
    label: "Procurement",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        description: "Procurement overview"
      },
      {
        title: "Purchase Orders",
        href: "/purchase-orders",
        description: "Manage orders"
      },
      {
        title: "Suppliers",
        href: "/suppliers",
        description: "Supplier management"
      }
    ]
  },
  warehouse_manager: {
    label: "Warehouse",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        description: "Warehouse overview"
      },
      {
        title: "Inventory",
        href: "/inventory",
        description: "Manage inventory"
      },
      {
        title: "Shipments",
        href: "/shipments",
        description: "Track shipments"
      }
    ]
  },
  transport_driver: {
    label: "Transport",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        description: "Delivery overview"
      },
      {
        title: "Deliveries",
        href: "/deliveries",
        description: "View assignments"
      },
      {
        title: "Route Planning",
        href: "/routes",
        description: "Plan delivery routes"
      }
    ]
  },
  transport_coordinator: {
    label: "Transport Coordinator",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard/transport-coordinator",
        description: "Transport coordination overview"
      },
      {
        title: "Tasks",
        href: "/dashboard/transport-coordinator/tasks",
        description: "Manage transport tasks"
      },
      {
        title: "Vehicles",
        href: "/dashboard/transport-coordinator/vehicles",
        description: "Fleet management"
      },
      {
        title: "Drivers",
        href: "/dashboard/transport-coordinator/drivers",
        description: "Driver assignments"
      },
      {
        title: "Issues",
        href: "/dashboard/transport-coordinator/issues",
        description: "Handle transport issues"
      }
    ]
  }
};
