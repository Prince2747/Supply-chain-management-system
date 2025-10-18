"use client";

import { useState, useEffect } from "react";
import { Bell, Clock, Sprout, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getHarvestNotifications, markNotificationAsRead } from "@/app/dashboard/field-agent/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<HarvestNotification[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const loadNotifications = async () => {
    setLoading(true);
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

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
    return <IconComponent className="h-4 w-4" />;
  };

  const getNotificationColor = (type: string) => {
    return notificationTypeColors[type] || notificationTypeColors.GENERAL;
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Notifications
            </DialogTitle>
            <DialogDescription>
              {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">No notifications yet</p>
                <p className="text-xs mt-1">We'll notify you when there's something important</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const IconComponent = notificationIcons[notification.notificationType] || Bell;
                  
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        notification.isRead 
                          ? "bg-gray-50 border-gray-200" 
                          : "bg-white border-green-200 shadow-sm"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={cn(
                            "p-2 rounded-full",
                            getNotificationColor(notification.notificationType)
                          )}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {notification.notificationType.replace(/_/g, ' ')}
                              </Badge>
                              {!notification.isRead && (
                                <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                              )}
                            </div>
                            
                            <p className={cn(
                              "text-sm mb-2",
                              !notification.isRead && "font-medium"
                            )}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Sprout className="h-3 w-3" />
                                {notification.cropBatch.cropType} - {notification.cropBatch.batchCode}
                              </span>
                              <span>
                                {notification.cropBatch.farm.name}
                              </span>
                              <span>
                                {formatDate(notification.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {!notification.isRead && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="flex-shrink-0"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
