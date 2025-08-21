"use client";

import { useState } from "react";
import { Search, Filter, Eye, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActivityLog } from "./activity-logs";

interface ActivityLogsClientProps {
  initialLogs: ActivityLog[];
}

const actionTypes = [
  "LOGIN",
  "LOGOUT",
  "CREATE_USER",
  "UPDATE_USER",
  "DELETE_USER",
  "CREATE_WAREHOUSE",
  "UPDATE_WAREHOUSE",
  "DELETE_WAREHOUSE",
  "CREATE_UNIT",
  "UPDATE_UNIT",
  "DELETE_UNIT",
];

const entityTypes = ["USER", "WAREHOUSE", "UNIT", "SYSTEM"];

export function ActivityLogsClient({ initialLogs }: ActivityLogsClientProps) {
  const [logs] = useState<ActivityLog[]>(initialLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  // Filter logs based on search term and filters
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress?.includes(searchTerm);

    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    const matchesEntity =
      entityFilter === "all" || log.entityType === entityFilter;

    return matchesSearch && matchesAction && matchesEntity;
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("CREATE")) return "success";
    if (action.includes("DELETE")) return "destructive";
    if (action.includes("UPDATE")) return "warning";
    if (action === "LOGIN") return "default";
    if (action === "LOGOUT") return "secondary";
    return "outline";
  };

  const formatDetails = (details: any) => {
    if (!details) return "No details";
    if (typeof details === "string") return details;
    return JSON.stringify(details, null, 2);
  };

  const exportToExcel = () => {
    try {
      // Prepare data for Excel export
      const exportData = filteredLogs.map((log, index) => ({
        "No.": index + 1,
        Date: new Date(log.createdAt).toLocaleDateString(),
        Time: new Date(log.createdAt).toLocaleTimeString(),
        "User Name": log.user?.name || "Unknown User",
        "User Email": log.user?.email || log.userId.slice(0, 8) + "...",
        Action: log.action.replace("_", " "),
        "Entity Type": log.entityType || "N/A",
        "Entity ID": log.entityId ? log.entityId.slice(0, 8) + "..." : "N/A",
        "IP Address": log.ipAddress || "Unknown",
        "User Agent": log.userAgent || "Unknown",
        Details: formatDetails(log.details),
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      const colWidths = [
        { wch: 5 }, // No.
        { wch: 12 }, // Date
        { wch: 12 }, // Time
        { wch: 20 }, // User Name
        { wch: 25 }, // User Email
        { wch: 15 }, // Action
        { wch: 12 }, // Entity Type
        { wch: 15 }, // Entity ID
        { wch: 15 }, // IP Address
        { wch: 30 }, // User Agent
        { wch: 40 }, // Details
      ];
      ws["!cols"] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Activity Logs");

      // Generate filename with current date
      const now = new Date();
      const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD format
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS format
      const filename = `activity-logs-${dateStr}-${timeStr}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast.success(
        `Activity logs exported successfully! Downloaded as ${filename}`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export activity logs. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Activity Logs</CardTitle>
              <CardDescription>
                Monitor system activity and user actions for security and
                auditing
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                Export Logs
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by action, user, or IP address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {actionTypes.map((action) => (
                  <SelectItem key={action} value={action}>
                    {action.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Activity Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-muted-foreground">
                          {logs.length === 0
                            ? "No activity logs available. This could be due to database connectivity issues or no logged activities yet."
                            : "No activity logs match your current filters."}
                        </div>
                        {logs.length === 0 && (
                          <div className="text-sm text-muted-foreground">
                            Activity logs will appear here once the database is
                            accessible and users perform actions.
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {log.user?.name || "Unknown User"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {log.user?.email || log.userId.slice(0, 8) + "..."}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {log.action.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          {log.entityType && (
                            <Badge variant="outline">{log.entityType}</Badge>
                          )}
                          {log.entityId && (
                            <div className="text-xs text-muted-foreground mt-1">
                              ID: {log.entityId.slice(0, 8)}...
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {log.ipAddress || "Unknown"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Log Details Modal/Card */}
      {selectedLog && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Activity Log Details</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Action:</strong> {selectedLog.action}
                  </div>
                  <div>
                    <strong>User:</strong> {selectedLog.user?.name || "Unknown"}{" "}
                    ({selectedLog.user?.email})
                  </div>
                  <div>
                    <strong>Timestamp:</strong>{" "}
                    {new Date(selectedLog.createdAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>IP Address:</strong>{" "}
                    {selectedLog.ipAddress || "Unknown"}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Entity Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Entity Type:</strong>{" "}
                    {selectedLog.entityType || "None"}
                  </div>
                  <div>
                    <strong>Entity ID:</strong> {selectedLog.entityId || "None"}
                  </div>
                </div>
              </div>
            </div>

            {selectedLog.userAgent && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">User Agent</h4>
                <div className="text-sm font-mono bg-muted p-2 rounded">
                  {selectedLog.userAgent}
                </div>
              </div>
            )}

            {selectedLog.details && (
              <div className="mt-4">
                <h4 className="font-semibold mb-2">Additional Details</h4>
                <pre className="text-sm bg-muted p-4 rounded overflow-auto max-h-40">
                  {formatDetails(selectedLog.details)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
