import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Truck, 
  Users, 
  Package, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
  TrendingUp
} from "lucide-react";
import { getTransportStats, getTransportTasks, getTransportIssues } from "./actions";

export default async function TransportCoordinatorDashboard() {
  const [stats, recentTasks, recentIssues] = await Promise.all([
    getTransportStats(),
    getTransportTasks().then(tasks => tasks.slice(0, 5)),
    getTransportIssues().then(issues => issues.slice(0, 5))
  ]);

  const statCards = [
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      description: `${stats.inTransitTasks} in transit`,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Available Vehicles",
      value: `${stats.availableVehicles}/${stats.totalVehicles}`,
      description: "Ready for assignment",
      icon: Truck,
      color: "text-green-600"
    },
    {
      title: "Available Drivers",
      value: `${stats.availableDrivers}/${stats.totalDrivers}`,
      description: "Ready for assignment",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      description: "Successfully delivered",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Open Issues",
      value: stats.openIssues,
      description: "Requiring attention",
      icon: AlertTriangle,
      color: "text-red-600"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transport Coordinator Dashboard</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/transport-coordinator/tasks">
              <Activity className="mr-2 h-4 w-4" />
              View All Tasks
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and management options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link href="/dashboard/transport-coordinator/tasks">
                <Package className="h-6 w-6 mb-2" />
                <span>Manage Tasks</span>
                <span className="text-xs text-muted-foreground">Assign & track transport</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link href="/dashboard/transport-coordinator/vehicles">
                <Truck className="h-6 w-6 mb-2" />
                <span>Manage Vehicles</span>
                <span className="text-xs text-muted-foreground">Fleet management</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link href="/dashboard/transport-coordinator/drivers">
                <Users className="h-6 w-6 mb-2" />
                <span>Manage Drivers</span>
                <span className="text-xs text-muted-foreground">Driver assignments</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link href="/dashboard/transport-coordinator/issues">
                <AlertTriangle className="h-6 w-6 mb-2" />
                <span>Handle Issues</span>
                <span className="text-xs text-muted-foreground">Resolve problems</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col" asChild>
              <Link href="/dashboard/transport-coordinator/reports">
                <TrendingUp className="h-6 w-6 mb-2" />
                <span>View Reports</span>
                <span className="text-xs text-muted-foreground">Performance analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transport Tasks</CardTitle>
            <CardDescription>Latest transport assignments and their status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div key={task.id} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{task.cropBatch.batchCode}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.vehicle.plateNumber} • {task.driver.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {task.status.replace('_', ' ').toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(task.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent transport tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Issues</CardTitle>
            <CardDescription>Latest transport issues requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentIssues.map((issue) => (
                <div key={issue.id} className="flex items-center space-x-4">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{issue.issueType.replace('_', ' ')}</p>
                    <p className="text-xs text-muted-foreground">
                      {issue.transportTask.vehicle.plateNumber} • {issue.transportTask.driver.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {issue.status.toLowerCase()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(issue.reportedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {recentIssues.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent issues
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
