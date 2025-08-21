"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FarmerManagement } from '@/components/field-agent/farmer-management';

export function FieldAgentDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
          </CardContent>
        </Card>
        {/* Add more field agent-specific metrics and functionalities */}
      </div>
      <FarmerManagement />
    </div>
  );
}
