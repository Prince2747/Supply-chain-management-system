"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Sprout,
  Building2,
  User,
  Calendar,
  Eye,
  Check
} from "lucide-react";
import { getHarvestNotifications, markNotificationAsRead } from "../actions";
import { toast } from "sonner";

interface HarvestNotification {
  id: string;
  message: string;
  notificationType: string;
  isRead: boolean;
  createdAt: Date;
  cropBatch: {
    batchCode: string;
    cropType: string;
    status: string;
    farm: {
      name: string;
      farmCode: string;
    };
    farmer: {
      name: string;
      farmerId: string;
    };
  };
}

const notificationTypeColors: Record<string, string> = {
  HARVEST_READY: "bg-green-100 text-green-800 border-green-200",
  INSPECTION_DUE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  PEST_ALERT: "bg-red-100 text-red-800 border-red-200",
  WEATHER_WARNING: "bg-orange-100 text-orange-800 border-orange-200",
  GENERAL: "bg-blue-100 text-blue-800 border-blue-200",
};

const notificationIcons: Record<string, any> = {
  HARVEST_READY: Sprout,
  INSPECTION_DUE: Clock,
  PEST_ALERT: AlertTriangle,
  WEATHER_WARNING: AlertTriangle,
  GENERAL: Bell,
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<HarvestNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const notificationsData = await getHarvestNotifications();
      setNotifications(notificationsData);
    } catch (error) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        toast.success("Notification marked as read");
        loadNotifications();
      } else {
        toast.error("Failed to mark as read");
      }
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "unread") return !notification.isRead;
    if (filter === "read") return notification.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const todayCount = notifications.filter(n => {
    const today = new Date().toDateString();
    return new Date(n.createdAt).toDateString() === today;
  }).length;

  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  const getNotificationIcon = (type: string) => {
    const IconComponent = notificationIcons[type] || Bell;
    return <IconComponent className="h-5 w-5" />;
  };

  const getNotificationColor = (type: string) => {
    return notificationTypeColors[type] || notificationTypeColors.GENERAL;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with harvest alerts and farm activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "unread" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </Button>
          <Button
            variant={filter === "read" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("read")}
          >
            Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">
              All notifications
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">
              New today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Harvest Ready</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => n.notificationType === 'HARVEST_READY').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for harvest
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            Latest updates and alerts from your farms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  notification.isRead 
                    ? "bg-gray-50 border-gray-200" 
                    : "bg-white border-blue-200 shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-2 rounded-lg ${getNotificationColor(notification.notificationType)}`}>
                      {getNotificationIcon(notification.notificationType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge 
                          variant="outline" 
                          className={getNotificationColor(notification.notificationType)}
                        >
                          {notification.notificationType.replace(/_/g, " ")}
                        </Badge>
                        {!notification.isRead && (
                          <Badge variant="default" className="bg-blue-600">
                            New
                          </Badge>
                        )}
                      </div>
                      
                      <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : 'text-gray-900 font-medium'}`}>
                        {notification.message}
                      </p>
                      
                      <div className="mt-2 flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center">
                          <Sprout className="mr-1 h-3 w-3" />
                          {notification.cropBatch.batchCode} - {notification.cropBatch.cropType}
                        </div>
                        <div className="flex items-center">
                          <Building2 className="mr-1 h-3 w-3" />
                          {notification.cropBatch.farm.name}
                        </div>
                        <div className="flex items-center">
                          <User className="mr-1 h-3 w-3" />
                          {notification.cropBatch.farmer.name}
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          {formatDate(notification.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.isRead && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Mark Read
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredNotifications.length === 0 && (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {filter === "unread" ? "No unread notifications" : 
                 filter === "read" ? "No read notifications" : "No notifications"}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filter === "all" 
                  ? "You'll see harvest alerts and farm updates here."
                  : `Switch to ${filter === "unread" ? "all" : "unread"} to see more notifications.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
