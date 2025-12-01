"use client";

import { useState } from "react";
import { Search, Filter, Eye, Download, X } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ActivityLog } from "./activity-logs";
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('admin.logsPage');
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
    if (!details) return t('noDetails');
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
        `${t('exportSuccess')} ${filename}`
      );
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error(t('exportFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('logs')}</CardTitle>
              <CardDescription>
                {t('description')}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                {t('exportLogs')}
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
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('allActions')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allActions')}</SelectItem>
                {actionTypes.map((action) => (
                  <SelectItem key={action} value={action}>
                    {t(`actions.${action}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={t('allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allTypes')}</SelectItem>
                {entityTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`entities.${type}`)}
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
                  <TableHead>{t('timestamp')}</TableHead>
                  <TableHead>{t('user')}</TableHead>
                  <TableHead>{t('action')}</TableHead>
                  <TableHead>{t('entity')}</TableHead>
                  <TableHead>{t('ipAddress')}</TableHead>
                  <TableHead className="text-right">{t('details')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center space-y-2">
                        <div className="text-muted-foreground">
                          {logs.length === 0
                            ? t('noLogsAvailable')
                            : t('noLogsFound')}
                        </div>
                        {logs.length === 0 && (
                          <div className="text-sm text-muted-foreground">
                            {t('logsWillAppear')}
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
                            {log.user?.name || t('unknownUser')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {log.user?.email || log.userId.slice(0, 8) + "..."}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(log.action)}>
                          {t(`actions.${log.action}`)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          {log.entityType && (
                            <Badge variant="outline">{t(`entities.${log.entityType}`)}</Badge>
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
                          {log.ipAddress || t('unknown')}
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

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('logDetails')}</DialogTitle>
            <DialogDescription>
              {t('logDetailsDescription')}
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                      {t('basicInformation')}
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{t('action')}</span>
                        <Badge variant={getActionBadgeVariant(selectedLog.action)} className="w-fit mt-1">
                          {t(`actions.${selectedLog.action}`)}
                        </Badge>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{t('user')}</span>
                        <span className="font-medium">{selectedLog.user?.name || t('unknown')}</span>
                        <span className="text-xs text-muted-foreground">{selectedLog.user?.email || selectedLog.userId}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{t('timestamp')}</span>
                        <span className="font-medium">
                          {new Date(selectedLog.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{t('ipAddress')}</span>
                        <span className="font-mono text-sm">
                          {selectedLog.ipAddress || t('unknown')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                      {t('entityInformation')}
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{t('entityType')}</span>
                        {selectedLog.entityType ? (
                          <Badge variant="outline" className="w-fit mt-1">
                            {t(`entities.${selectedLog.entityType}`)}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">{t('none')}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{t('entityId')}</span>
                        <span className="font-mono text-xs break-all">
                          {selectedLog.entityId || t('none')}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{t('logId')}</span>
                        <span className="font-mono text-xs break-all text-muted-foreground">
                          {selectedLog.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedLog.userAgent && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    {t('userAgent')}
                  </h4>
                  <div className="text-xs font-mono bg-muted p-3 rounded border break-all">
                    {selectedLog.userAgent}
                  </div>
                </div>
              )}

              {selectedLog.details && (
                <div>
                  <h4 className="font-semibold text-sm text-muted-foreground mb-2">
                    {t('additionalDetails')}
                  </h4>
                  <pre className="text-xs bg-muted p-4 rounded border overflow-auto max-h-60">
                    {formatDetails(selectedLog.details)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
