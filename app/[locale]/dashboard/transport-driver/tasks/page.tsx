import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Package,
  Truck,
  User,
  QrCode
} from "lucide-react";
import { getAllDriverTasks } from "../actions";
import { getTranslations } from "next-intl/server";

export default async function TasksPage() {
  const t = await getTranslations("transportDriver.tasks");
  const tasks = await getAllDriverTasks();

  const activeTasks = tasks.filter(task => 
    task.status === "SCHEDULED" || task.status === "IN_TRANSIT"
  );
  const completedTasks = tasks.filter(task => task.status === "DELIVERED");
  const otherTasks = tasks.filter(task => 
    !["SCHEDULED", "IN_TRANSIT", "DELIVERED"].includes(task.status)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "IN_TRANSIT":
        return "bg-green-100 text-green-800";
      case "DELIVERED":
        return "bg-gray-100 text-gray-800";
      case "DELAYED":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const TaskCard = ({ task, showActions = false }: { task: any; showActions?: boolean }) => (
    <Card key={task.id} className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{task.cropBatch.batchCode}</CardTitle>
            <CardDescription className="flex items-center space-x-2 mt-2">
              <Package className="h-4 w-4" />
              <span>{task.cropBatch.farm.name}</span>
              <span>•</span>
              <Truck className="h-4 w-4" />
              <span>{task.vehicle.plateNumber}</span>
            </CardDescription>
          </div>
          <Badge className={getStatusColor(task.status)}>
            {task.status.toLowerCase().replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t("pickup")}:</span>
              <span>{task.pickupLocation}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t("delivery")}:</span>
              <span>{task.deliveryLocation}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{t("scheduled")}:</span>
              <span>{new Date(task.scheduledDate).toLocaleString()}</span>
            </div>
            {task.actualPickupDate && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t("pickedUp")}:</span>
                <span>{new Date(task.actualPickupDate).toLocaleString()}</span>
              </div>
            )}
            {task.actualDeliveryDate && (
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{t("delivered")}:</span>
                <span>{new Date(task.actualDeliveryDate).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        {task.notes && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">{t("notes")}:</span>
            <p className="text-sm text-muted-foreground mt-1">{task.notes}</p>
          </div>
        )}

        {task.issues && task.issues.length > 0 && (
          <div className="mt-4">
            <span className="text-sm font-medium text-orange-600">
              {t("issuesCount", { count: task.issues.length })}:
            </span>
            <div className="mt-2 space-y-2">
              {task.issues.map((issue: any) => (
                <div key={issue.id} className="p-2 bg-orange-50 rounded border-l-4 border-orange-200">
                  <p className="text-sm font-medium">
                    {issue.issueType.replace('_', ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </p>
                  <p className="text-sm text-muted-foreground">{issue.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {showActions && (
          <div className="mt-4 flex space-x-2">
            {task.status === "SCHEDULED" && (
              <Link href={`/dashboard/transport-driver/scanner?taskId=${task.id}&action=pickup`}>
                <Button size="sm" variant="outline">
                  <QrCode className="h-4 w-4 mr-2" />
                  {t("confirmPickup")}
                </Button>
              </Link>
            )}
            {task.status === "IN_TRANSIT" && (
              <Link href={`/dashboard/transport-driver/scanner?taskId=${task.id}&action=delivery`}>
                <Button size="sm">
                  <QrCode className="h-4 w-4 mr-2" />
                  {t("confirmDelivery")}
                </Button>
              </Link>
            )}
            <Link href={`/dashboard/transport-driver/issues?taskId=${task.id}`}>
              <Button size="sm" variant="outline">
                {t("reportIssue")}
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("description")}
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("activeTasks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("completedTasks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("totalTasks")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("issues")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.reduce((sum, task) => sum + task.issues.length, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">{t("activeTasksSection")}</h2>
          <div className="space-y-4">
            {activeTasks.map((task) => (
              <TaskCard key={task.id} task={task} showActions={true} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">{t("completedTasksSection")}</h2>
          <div className="space-y-4">
            {completedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Other Tasks (Delayed, Cancelled, etc.) */}
      {otherTasks.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">{t("otherTasksSection")}</h2>
          <div className="space-y-4">
            {otherTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t("noTasksTitle")}</h3>
          <p className="text-muted-foreground">
            {t("noTasksDesc")}
          </p>
        </div>
      )}
    </div>
  );
}
