"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, Users, LineChart } from "lucide-react";

export default function ManagerDashboard() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Manager Dashboard</h1>
      
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-4 sm:p-6">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-medium">Team Management</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage your team members and their assignments
            </p>
            <Button asChild className="w-full text-xs sm:text-sm">
              <Link href="/dashboard/manager/team">
                <Users className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                View Team
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-medium">Reports</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              View and analyze performance reports
            </p>
            <Button asChild className="w-full text-xs sm:text-sm">
              <Link href="/dashboard/manager/reports">
                <LineChart className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                View Reports
              </Link>
            </Button>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-medium">Tasks Overview</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Monitor and manage team tasks
            </p>
            <Button asChild className="w-full text-xs sm:text-sm">
              <Link href="/dashboard/manager/tasks">
                <ClipboardList className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                View Tasks
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
