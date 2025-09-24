"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  QrCode, 
  Warehouse, 
  BarChart3,
  PackageCheck,
  Scan,
  Archive
} from "lucide-react";

// Navigation items for the side bar
const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard/warehouse-manager",
    icon: BarChart3,
  },
  {
    name: "Packaging",
    href: "/dashboard/warehouse-manager/packaging",
    icon: PackageCheck,
  },
  {
    name: "Receipt Scanner",
    href: "/dashboard/warehouse-manager/scanner",
    icon: Scan,
  },
  {
    name: "Storage",
    href: "/dashboard/warehouse-manager/storage",
    icon: Archive,
  },
];

export function WarehouseManagerNavigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  return (
    <div className="flex min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* Side Navigation */}
      <div className="group w-16 hover:w-64 bg-white border-r transition-all duration-300 ease-in-out overflow-hidden sticky top-16 h-[calc(100vh-4rem)]">
        <div className="flex flex-col h-full">
          <nav className="flex-1 space-y-1 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    isActive
                      ? "bg-green-100 text-green-900 border-r-2 border-green-500"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    "group/item flex items-center px-4 py-3 text-sm font-medium whitespace-nowrap relative"
                  )}
                  title={item.name}
                >
                  <item.icon
                    className={cn(
                      isActive
                        ? "text-green-500"
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
      <div className="flex-1 overflow-y-auto overflow-x-hidden h-[calc(100vh-4rem)]">
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}