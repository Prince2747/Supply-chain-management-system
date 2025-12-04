"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Activity,
  Truck,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Calendar as CalendarIcon,
  Loader2
} from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { TransportChart } from "@/components/transport-coordinator/transport-chart";
import { VehicleUtilizationChart } from "@/components/transport-coordinator/vehicle-utilization-chart";
import { DriverPerformanceTable } from "@/components/transport-coordinator/driver-performance-table";
import { toast } from "sonner";

interface TransportReports {
  overview: {
    totalTasks: number;
    completedTasks: number;
    delayedTasks: number;
    cancelledTasks: number;
    completionRate: number;
    onTimeRate: number;
    issueRate: number;
    totalIssues: number;
  };
  vehicleUtilization: any[];
  driverPerformance: any[];
  dailyTrends: any[];
  issueBreakdown: Record<string, number>;
  recentTasks: any[];
  recentIssues: any[];
}

interface TransportReportsClientProps {
  initialReports: TransportReports;
}

export function TransportReportsClient({ initialReports }: TransportReportsClientProps) {
  const t = useTranslations("transportCoordinator.reports");
  const [reports, setReports] = useState<TransportReports>(initialReports);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    to: new Date(),
  });

  const kpiCards = [
    {
      title: t("completionRate"),
      value: `${reports.overview.completionRate}%`,
      description: `${reports.overview.completedTasks}/${reports.overview.totalTasks} ${t("completionRateDesc")}`,
      icon: CheckCircle,
      color: "text-green-600",
      trend: reports.overview.completionRate >= 80 ? "up" : "down"
    },
    {
      title: t("onTimePerformance"),
      value: `${reports.overview.onTimeRate}%`,
      description: t("onTimePerformanceDesc"),
      icon: Clock,
      color: reports.overview.onTimeRate >= 85 ? "text-green-600" : "text-amber-600",
      trend: reports.overview.onTimeRate >= 85 ? "up" : "down"
    },
    {
      title: t("issueRate"),
      value: `${reports.overview.issueRate}%`,
      description: `${reports.overview.totalIssues} ${t("issueRateDesc")}`,
      icon: AlertTriangle,
      color: reports.overview.issueRate <= 10 ? "text-green-600" : "text-red-600",
      trend: reports.overview.issueRate <= 10 ? "up" : "down"
    },
    {
      title: t("taskVolume"),
      value: reports.overview.totalTasks,
      description: t("taskVolumeDesc"),
      icon: Activity,
      color: "text-blue-600",
      trend: "up"
    },
  ];

  const fetchReports = async (from?: Date, to?: Date) => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (from) searchParams.append('from', from.toISOString());
      if (to) searchParams.append('to', to.toISOString());
      
      const response = await fetch(`/api/transport-coordinator/reports?${searchParams}`);
      if (response.ok) {
        const newReports = await response.json();
        setReports(newReports);
        toast.success(t("reportsFetched"));
      } else {
        toast.error(t("fetchError"));
      }
    } catch (error) {
      toast.error(t("fetchError"));
    }
    setLoading(false);
  };

  const handleDateRangeChange = (newDateRange: DateRange | undefined) => {
    setDateRange(newDateRange);
    if (newDateRange?.from && newDateRange?.to) {
      fetchReports(newDateRange.from, newDateRange.to);
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Tasks', reports.overview.totalTasks],
      ['Completed Tasks', reports.overview.completedTasks],
      ['Delayed Tasks', reports.overview.delayedTasks],
      ['Cancelled Tasks', reports.overview.cancelledTasks],
      ['Completion Rate (%)', reports.overview.completionRate],
      ['On-Time Rate (%)', reports.overview.onTimeRate],
      ['Issue Rate (%)', reports.overview.issueRate],
      ['Total Issues', reports.overview.totalIssues],
      [''],
      ['Vehicle Utilization'],
      ['Vehicle', 'Tasks', 'Utilization Rate (%)'],
      ...reports.vehicleUtilization.map(v => [v.plateNumber, v.tasksCount, v.utilizationRate]),
      [''],
      ['Driver Performance'],
      ['Driver', 'Tasks', 'Completed', 'Issues', 'On-Time Rate (%)'],
      ...reports.driverPerformance.map(d => [d.name, d.tasksCount, d.completedTasks, d.issuesCount, d.onTimeRate]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transport-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    toast.success(t("reportExported"));
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
            {dateRange?.from && dateRange?.to && (
              <span className="ml-1">
                {t("from")} {format(dateRange.from, "MMM d, yyyy")} {t("to")} {format(dateRange.to, "MMM d, yyyy")}
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex items-center space-x-2 justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
                disabled={loading}
              >
                <CalendarIcon className="h-4 w-4" />
                <span>
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    t("selectDateRange")
                  )}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button 
            className="flex items-center space-x-2"
            onClick={exportToCSV}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span>{t("exportReport")}</span>
          </Button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading reports...</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {kpi.title}
              </CardTitle>
              <div className="flex items-center space-x-1">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                {kpi.trend === "up" ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dailyTaskTrends")}</CardTitle>
            <CardDescription>{t("viewTaskTrends")}</CardDescription>
          </CardHeader>
          <CardContent>
            <TransportChart data={reports.dailyTrends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("issueBreakdown")}</CardTitle>
            <CardDescription>{t("issuesReportedByCategory")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(reports.issueBreakdown).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${(count / Math.max(reports.overview.totalIssues, 1)) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <Badge variant="secondary">{count}</Badge>
                  </div>
                </div>
              ))}
              {Object.keys(reports.issueBreakdown).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noData")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>{t("vehicleUtilization")}</CardTitle>
          <CardDescription>{t("vehicleUsageAndEfficiency")}</CardDescription>
        </CardHeader>
        <CardContent>
          <VehicleUtilizationChart data={reports.vehicleUtilization} />
        </CardContent>
      </Card>

      {/* Driver Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{t("driverPerformance")}</CardTitle>
          <CardDescription>{t("driverProductivityMetrics")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DriverPerformanceTable data={reports.driverPerformance} />
        </CardContent>
      </Card>

      {/* Recent Activity Summary */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("recentTasks")}</CardTitle>
            <CardDescription>{t("latestCompletedTasks")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.recentTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.cropBatch.batchCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.vehicle.plateNumber} • {task.driver.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      task.status === "DELIVERED" ? "default" :
                      task.status === "IN_TRANSIT" ? "secondary" :
                      task.status === "DELAYED" ? "destructive" :
                      task.status === "CANCELLED" ? "outline" :
                      "secondary"
                    }>
                      {task.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(task.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {reports.recentTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noData")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentIssuesReported")}</CardTitle>
            <CardDescription>{t("latestReportedIssues")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.recentIssues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex items-start space-x-3">
                  <div className="mt-1">
                    <AlertTriangle className={`h-4 w-4 ${
                      issue.status === "OPEN" ? "text-red-500" :
                      issue.status === "IN_PROGRESS" ? "text-blue-500" :
                      issue.status === "ESCALATED" ? "text-orange-500" :
                      "text-green-500"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">
                        {issue.issueType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                      <Badge variant={
                        issue.status === "OPEN" ? "destructive" :
                        issue.status === "IN_PROGRESS" ? "default" :
                        issue.status === "ESCALATED" ? "secondary" :
                        "default"
                      }>
                        {issue.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {issue.transportTask.vehicle.plateNumber} • {new Date(issue.reportedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {reports.recentIssues.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noData")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
