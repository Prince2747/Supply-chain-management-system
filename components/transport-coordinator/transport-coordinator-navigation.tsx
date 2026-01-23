"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Truck, Users, Package, AlertTriangle, BarChart3, Calendar } from "lucide-react";
import { TransportNotificationBell } from "@/components/notifications/unified-notification-bell";

export function TransportCoordinatorNavigation({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("transportCoordinator.navigation");
  
  // Navigation items for the side bar
  const navigation = [
    {
      name: t("dashboard"),
      href: `/${locale}/dashboard/transport-coordinator`,
      icon: BarChart3,
    },
    {
      name: t("scheduleTasks"),
      href: `/${locale}/dashboard/transport-coordinator/schedule`,
      icon: Calendar,
    },
    {
      name: t("transportTasks"),
      href: `/${locale}/dashboard/transport-coordinator/tasks`,
      icon: Package,
    },
    {
      name: t("vehicles"),
      href: `/${locale}/dashboard/transport-coordinator/vehicles`,
      icon: Truck,
    },
    {
      name: t("drivers"),
      href: `/${locale}/dashboard/transport-coordinator/drivers`,
      icon: Users,
    },
    {
      name: t("issues"),
      href: `/${locale}/dashboard/transport-coordinator/issues`,
      icon: AlertTriangle,
    },
    {
      name: t("reports"),
      href: `/${locale}/dashboard/transport-coordinator/reports`,
      icon: BarChart3,
    },
  ];
  
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
          
          {/* Notification Bell */}
          <div className="p-4 border-t">
            <div className="flex items-center justify-center group-hover:justify-start">
              <TransportNotificationBell />
              <span className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm text-gray-600">
                Notifications
              </span>
            </div>
          </div>
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
