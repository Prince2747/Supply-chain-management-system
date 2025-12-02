"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, Users, LineChart } from "lucide-react";

export default function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Manager Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Team Management</h3>
            <p className="text-sm text-muted-foreground">
              Manage your team members and their assignments
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/manager/team">
                <Users className="mr-2 h-4 w-4" />
                View Team
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Reports</h3>
            <p className="text-sm text-muted-foreground">
              View and analyze performance reports
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/manager/reports">
                <LineChart className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Tasks Overview</h3>
            <p className="text-sm text-muted-foreground">
              Monitor and manage team tasks
            </p>
            <Button asChild className="w-full">
              <Link href="/dashboard/manager/tasks">
                <ClipboardList className="mr-2 h-4 w-4" />
                View Tasks
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
