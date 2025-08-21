"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Farm, Users, Bell } from "lucide-react";

export default function FieldAgentDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Field Agent Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Farm Management</h3>
            <p className="text-sm text-muted-foreground">
              View and manage registered farms
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/field-agent/farms">
                <Farm className="mr-2 h-4 w-4" />
                Manage Farms
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Farmers</h3>
            <p className="text-sm text-muted-foreground">
              Access farmer profiles and details
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/field-agent/farmers">
                <Users className="mr-2 h-4 w-4" />
                View Farmers
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Check updates and alerts
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/field-agent/notifications">
                <Bell className="mr-2 h-4 w-4" />
                View Notifications
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
