import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  ArrowUpRight,
  Truck,
  User,
  Package,
  Plus
} from "lucide-react";
import { getTransportIssues } from "../actions";
import { IssuesTable } from "@/components/transport-coordinator/issues-table";
import { CreateIssueDialog } from "@/components/transport-coordinator/create-issue-dialog";

export default async function IssuesPage() {
  const t = await getTranslations("transportCoordinator.issues");
  const issues = await getTransportIssues();

  // Calculate stats
  const stats = {
    total: issues.length,
    open: issues.filter(issue => issue.status === "OPEN").length,
    inProgress: issues.filter(issue => issue.status === "IN_PROGRESS").length,
    resolved: issues.filter(issue => issue.status === "RESOLVED").length,
    escalated: issues.filter(issue => issue.status === "ESCALATED").length,
  };

  const statCards = [
    {
      title: t("totalIssues"),
      value: stats.total,
      description: t("allTransportIssues"),
      icon: AlertTriangle,
      color: "text-orange-600"
    },
    {
      title: t("openIssues"),
      value: stats.open,
      description: t("requiringAttention"),
      icon: Clock,
      color: "text-red-600"
    },
    {
      title: t("inProgress"),
      value: stats.inProgress,
      description: t("beingResolved"),
      icon: ArrowUpRight,
      color: "text-blue-600"
    },
    {
      title: t("resolved"),
      value: stats.resolved,
      description: t("successfullyResolved"),
      icon: CheckCircle,
      color: "text-green-600"
    },
  ];

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <CreateIssueDialog />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Issues by Type */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("issuesByType")}</CardTitle>
            <CardDescription>{t("breakdownOfCategories")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(
                issues.reduce((acc, issue) => {
                  acc[issue.issueType] = (acc[issue.issueType] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("recentIssues")}</CardTitle>
            <CardDescription>{t("latestReportedIssues")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {issues.slice(0, 5).map((issue) => (
                <div key={issue.id} className="flex items-start space-x-3">
                  <div className="mt-1">
                    <AlertTriangle className={`h-4 w-4 ${
                      issue.status === "OPEN" ? "text-red-500" :
                      issue.status === "IN_PROGRESS" ? "text-blue-500" :
                      issue.status === "ESCALATED" ? "text-orange-500" :
                      "text-green-500"
                    }`} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">
                        {issue.issueType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
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
                      {issue.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Truck className="h-3 w-3" />
                        <span>{issue.transportTask.vehicle.plateNumber}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{issue.transportTask.driver.name}</span>
                      </span>
                      <span>{new Date(issue.reportedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {issues.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noIssuesReported")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("allIssues")}</CardTitle>
          <CardDescription>{t("completeListOfIssues")}</CardDescription>
        </CardHeader>
        <CardContent>
          <IssuesTable issues={issues} />
        </CardContent>
      </Card>
    </div>
  );
}
