import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  Truck, 
  Package, 
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  QrCode,
  MapPin,
  Calendar
} from "lucide-react";
import { getDriverStats, getAssignedTasks } from "./actions";

export default async function TransportDriverDashboard() {
  const [stats, assignedTasks] = await Promise.all([
    getDriverStats(),
    getAssignedTasks()
  ]);

  const statCards = [
    {
      title: "Assigned Tasks",
      value: stats.scheduledTasks + stats.inTransitTasks,
      description: `${stats.scheduledTasks} scheduled, ${stats.inTransitTasks} in transit`,
      icon: Package,
      color: "text-blue-600"
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      description: "Successfully delivered",
      icon: CheckCircle,
      color: "text-green-600"
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      description: "All time tasks assigned",
      icon: Truck,
      color: "text-purple-600"
    },
    {
      title: "Open Issues",
      value: stats.openIssues,
      description: "Requiring attention",
      icon: AlertTriangle,
      color: stats.openIssues > 0 ? "text-red-600" : "text-green-600"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Driver Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {stats.driverInfo.name}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm font-medium">License: {stats.driverInfo.licenseNumber}</p>
            <Badge variant={stats.driverInfo.status === "AVAILABLE" ? "default" : "secondary"}>
              {stats.driverInfo.status.toLowerCase().replace('_', ' ')}
            </Badge>
          </div>
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
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

      {/* Assigned Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Assigned Tasks</CardTitle>
          <CardDescription>Your current transport assignments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {assignedTasks.map((task) => (
              <div key={task.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{task.cropBatch.batchCode}</h3>
                    <Badge variant={
                      task.status === "SCHEDULED" ? "secondary" :
                      task.status === "IN_TRANSIT" ? "default" :
                      "outline"
                    }>
                      {task.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {task.cropBatch.farm.name} • {task.vehicle.plateNumber}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{task.pickupLocation}</span>
                    </span>
                    <span>→</span>
                    <span className="flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{task.deliveryLocation}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(task.scheduledDate).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 space-x-2">
                    {task.status === "SCHEDULED" && (
                      <Link href={`/dashboard/transport-driver/scanner?taskId=${task.id}&action=pickup`}>
                        <Button size="sm" variant="outline">
                          Confirm Pickup
                        </Button>
                      </Link>
                    )}
                    {task.status === "IN_TRANSIT" && (
                      <Link href={`/dashboard/transport-driver/scanner?taskId=${task.id}&action=delivery`}>
                        <Button size="sm">
                          Confirm Delivery
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {assignedTasks.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No assigned tasks today</p>
                <p className="text-sm text-muted-foreground">Check back later for new assignments</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
