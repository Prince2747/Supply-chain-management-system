"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";

interface VehicleUtilization {
  id: string;
  plateNumber: string;
  type: string;
  tasksCount: number;
  utilizationRate: number;
}

interface VehicleUtilizationChartProps {
  data: VehicleUtilization[];
}

export function VehicleUtilizationChart({ data }: VehicleUtilizationChartProps) {
  const chartData = useMemo(() => {
    return data.map(vehicle => ({
      ...vehicle,
      utilizationRate: Math.round(vehicle.utilizationRate)
    }));
  }, [data]);

  const getBarColor = (rate: number) => {
    if (rate >= 80) return "#10b981"; // Green for high utilization
    if (rate >= 60) return "#f59e0b"; // Yellow for medium utilization
    return "#ef4444"; // Red for low utilization
  };

  if (data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-muted-foreground">
        No vehicle data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="plateNumber" 
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string) => [
                `${value}%`,
                'Utilization Rate'
              ]}
              labelFormatter={(label: string) => {
                const vehicle = data.find(v => v.plateNumber === label);
                return (
                  <div>
                    <span className="font-medium">{label}</span>
                    <br />
                    <span className="text-sm text-gray-600">
                      {vehicle?.type} • {vehicle?.tasksCount} tasks
                    </span>
                  </div>
                );
              }}
            />
            <Bar dataKey="utilizationRate" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.utilizationRate)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Vehicle Details Table */}
      <div className="grid gap-2">
        <h4 className="text-sm font-medium">Vehicle Performance Summary</h4>
        <div className="space-y-2">
          {data.map((vehicle) => (
            <div key={vehicle.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="font-medium text-sm">{vehicle.plateNumber}</span>
                <Badge variant="outline" className="text-xs">
                  {vehicle.type.replace('_', ' ').toLowerCase()}
                </Badge>
              </div>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">
                  {vehicle.tasksCount} tasks
                </span>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: getBarColor(vehicle.utilizationRate) }}
                  ></div>
                  <span className="font-medium">
                    {Math.round(vehicle.utilizationRate)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
