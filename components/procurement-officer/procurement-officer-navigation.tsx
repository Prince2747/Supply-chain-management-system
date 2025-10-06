"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  BarChart3,
  ClipboardList,
  Package,
  CheckSquare,
  Bell,
  FileText
} from "lucide-react";

// Navigation items for the side bar
const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard/procurement-officer",
    icon: BarChart3,
  },
  {
    name: "Stock Requirements",
    href: "/dashboard/procurement-officer/stock-requirements",
    icon: ClipboardList,
  },
  {
    name: "Inventory Monitor",
    href: "/dashboard/procurement-officer/inventory",
    icon: Package,
  },
  {
    name: "Batch Reviews",
    href: "/dashboard/procurement-officer/batch-reviews",
    icon: CheckSquare,
  },
  {
    name: "Notifications",
    href: "/dashboard/procurement-officer/notifications",
    icon: Bell,
  },
];

export function ProcurementOfficerNavigation({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto overflow-x-hidden">
      <nav
        className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 p-4", className)}
        {...props}
      >
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "text-muted-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-green-600" : ""
                )} 
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}