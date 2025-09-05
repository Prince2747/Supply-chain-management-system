"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Truck, Users, Package, AlertTriangle, BarChart3 } from "lucide-react";

// Navigation items for the side bar
const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard/transport-coordinator",
    icon: BarChart3,
  },
  {
    name: "Transport Tasks",
    href: "/dashboard/transport-coordinator/tasks",
    icon: Package,
  },
  {
    name: "Vehicles",
    href: "/dashboard/transport-coordinator/vehicles",
    icon: Truck,
  },
  {
    name: "Drivers",
    href: "/dashboard/transport-coordinator/drivers",
    icon: Users,
  },
  {
    name: "Issues",
    href: "/dashboard/transport-coordinator/issues",
    icon: AlertTriangle,
  },
  {
    name: "Reports",
    href: "/dashboard/transport-coordinator/reports",
    icon: BarChart3,
  },
];

export function TransportCoordinatorNavigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* Side Navigation */}
      <div className="group w-16 hover:w-64 bg-white border-r transition-all duration-300 ease-in-out overflow-hidden">
        <div className="flex flex-col h-full">
          <nav className="flex-1 space-y-1 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    "group/item flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap"
                  )}
                  title={item.name}
                >
                  <item.icon
                    className={cn(
                      isActive
                        ? "text-gray-500"
                        : "text-gray-400 group-hover/item:text-gray-500",
                      "flex-shrink-0 h-5 w-5"
                    )}
                    aria-hidden="true"
                  />
                  <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        <div className="h-full p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
