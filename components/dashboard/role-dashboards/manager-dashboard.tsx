"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ManagerDashboard() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Shipments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">0</div>
        </CardContent>
      </Card>
      
      {/* Add more manager-specific metrics and functionalities */}
    </div>
  );
}
