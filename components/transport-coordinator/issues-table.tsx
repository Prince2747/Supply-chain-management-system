"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  AlertTriangle, 
  Search, 
  Filter,
  Eye,
  Edit
} from "lucide-react";
import { UpdateIssueDialog } from "./update-issue-dialog";

interface Issue {
  id: string;
  issueType: string;
  description: string;
  status: string;
  reportedAt: Date;
  resolvedAt: Date | null;
  resolution: string | null;
  transportTask: {
    vehicle: {
      plateNumber: string;
    };
    driver: {
      name: string;
    };
    cropBatch: {
      batchCode: string;
    };
  };
}

interface IssuesTableProps {
  issues: Issue[];
}

export function IssuesTable({ issues }: IssuesTableProps) {
  const [filteredIssues, setFilteredIssues] = useState(issues);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filter issues based on search term and filters
  const handleFilter = () => {
    let filtered = issues;

    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.transportTask.vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.transportTask.driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.transportTask.cropBatch.batchCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(issue => issue.status === statusFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(issue => issue.issueType === typeFilter);
    }

    setFilteredIssues(filtered);
  };

  // Apply filters when search term or filters change
  useState(() => {
    handleFilter();
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <Badge variant="destructive">Open</Badge>;
      case "IN_PROGRESS":
        return <Badge variant="default">In Progress</Badge>;
      case "RESOLVED":
        return <Badge variant="default">Resolved</Badge>;
      case "ESCALATED":
        return <Badge variant="secondary">Escalated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getIssueIcon = (type: string) => {
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };

  const uniqueTypes = Array.from(new Set(issues.map(issue => issue.issueType)));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search issues, vehicles, drivers..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setTimeout(handleFilter, 300); // Debounce search
            }}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => {
          setStatusFilter(value);
          setTimeout(handleFilter, 100);
        }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="ESCALATED">Escalated</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(value) => {
          setTypeFilter(value);
          setTimeout(handleFilter, 100);
        }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {uniqueTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Issue</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead>Reported</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredIssues.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>
                  <div className="flex items-start space-x-3">
                    {getIssueIcon(issue.issueType)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {issue.issueType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {issue.description}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {issue.issueType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(issue.status)}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">
                    {issue.transportTask.vehicle.plateNumber}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {issue.transportTask.driver.name}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {issue.transportTask.cropBatch.batchCode}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {new Date(issue.reportedAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <UpdateIssueDialog issue={issue} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filteredIssues.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  {issues.length === 0 ? "No issues found" : "No issues match your filters"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredIssues.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredIssues.length} of {issues.length} issues
        </div>
      )}
    </div>
  );
}
