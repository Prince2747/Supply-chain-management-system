import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Plus } from "lucide-react";
import { getDriverIssues, getAssignedTasks } from "../actions";
import { ReportIssueDialog } from "@/components/transport-driver/report-issue-dialog";

interface IssuesPageProps {
  searchParams: Promise<{
    taskId?: string;
  }>;
}

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const { taskId } = await searchParams;
  const [issues, tasks] = await Promise.all([
    getDriverIssues(),
    getAssignedTasks()
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "ESCALATED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transport Issues</h1>
          <p className="text-muted-foreground">
            Report and track transport-related issues
          </p>
        </div>
        <ReportIssueDialog tasks={tasks} preSelectedTaskId={taskId} />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{issues.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issues.filter(issue => issue.status === "OPEN").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issues.filter(issue => issue.status === "IN_PROGRESS").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {issues.filter(issue => issue.status === "RESOLVED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle>Reported Issues</CardTitle>
          <CardDescription>All transport issues you have reported</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <div>
                      <h3 className="font-medium">
                        {issue.issueType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Task: {issue.transportTask.cropBatch.batchCode} • {issue.transportTask.vehicle.plateNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(issue.status)}>
                      {issue.status.toLowerCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(issue.reportedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium">Description:</span>
                    <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                  </div>

                  {issue.resolution && (
                    <div>
                      <span className="text-sm font-medium text-green-600">Resolution:</span>
                      <p className="text-sm text-muted-foreground mt-1">{issue.resolution}</p>
                      {issue.resolvedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Resolved on {new Date(issue.resolvedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      Pickup: {issue.transportTask.pickupLocation} → Delivery: {issue.transportTask.deliveryLocation}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {issues.length === 0 && (
              <div className="text-center py-12">
                <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Issues Reported</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't reported any transport issues yet.
                </p>
                {tasks.length > 0 && (
                  <ReportIssueDialog tasks={tasks}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Report Your First Issue
                    </Button>
                  </ReportIssueDialog>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Issue Types Help */}
      <Card>
        <CardHeader>
          <CardTitle>Issue Types</CardTitle>
          <CardDescription>Common types of transport issues you can report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium">Vehicle Breakdown</h4>
              <p className="text-sm text-muted-foreground">
                Mechanical issues, flat tires, engine problems
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Traffic Delay</h4>
              <p className="text-sm text-muted-foreground">
                Unexpected traffic jams, road closures
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Weather Delay</h4>
              <p className="text-sm text-muted-foreground">
                Rain, storm, or other weather conditions
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Damaged Goods</h4>
              <p className="text-sm text-muted-foreground">
                Crop damage during transport
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Route Change</h4>
              <p className="text-sm text-muted-foreground">
                Need to change pickup or delivery location
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Other</h4>
              <p className="text-sm text-muted-foreground">
                Any other issues not listed above
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
