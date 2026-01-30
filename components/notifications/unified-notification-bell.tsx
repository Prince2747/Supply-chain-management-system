'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, Clock, Truck, AlertTriangle, Check, Package, CheckCircle, Calendar, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/notifications/unified-actions';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { NotificationCategory, NotificationType } from '@/lib/generated/prisma';
import type { Prisma } from '@prisma/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
  createdAt: Date;
  actionUrl?: string | null;
  priority: string;
  metadata?: Prisma.JsonValue;
}

type NotificationBellProps = {
  category?: NotificationCategory;
  className?: string;
};

const notificationTypeColors: Record<string, string> = {
  // Transport
  TRANSPORT_SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-200',
  DRIVER_ASSIGNED: 'bg-green-100 text-green-800 border-green-200',
  ROUTE_DELAYED: 'bg-orange-100 text-orange-800 border-orange-200',
  VEHICLE_ISSUE: 'bg-red-100 text-red-800 border-red-200',
  TASK_ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-200',
  TASK_COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  ROUTE_UPDATED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PICKUP_READY: 'bg-teal-100 text-teal-800 border-teal-200',
  DELIVERY_CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
  SCHEDULE_CHANGED: 'bg-orange-100 text-orange-800 border-orange-200',
  ISSUE_REPORTED: 'bg-red-100 text-red-800 border-red-200',
  
  // Warehouse
  SHIPMENT_ARRIVING: 'bg-blue-100 text-blue-800 border-blue-200',
  STORAGE_FULL: 'bg-red-100 text-red-800 border-red-200',
  BATCH_RECEIVED: 'bg-green-100 text-green-800 border-green-200',
  PACKAGING_COMPLETE: 'bg-teal-100 text-teal-800 border-teal-200',
  QUALITY_CHECK_NEEDED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  LOW_STOCK_ALERT: 'bg-orange-100 text-orange-800 border-orange-200',
  
  // General
  GENERAL: 'bg-gray-100 text-gray-800 border-gray-200',
  ANNOUNCEMENT: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  REMINDER: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  SYSTEM_ALERT: 'bg-red-100 text-red-800 border-red-200',
};

const notificationIcons: Record<string, LucideIcon> = {
  // Transport
  TRANSPORT_SCHEDULED: Calendar,
  DRIVER_ASSIGNED: Truck,
  ROUTE_DELAYED: Clock,
  VEHICLE_ISSUE: AlertTriangle,
  TASK_ASSIGNED: Package,
  TASK_COMPLETED: CheckCircle,
  ROUTE_UPDATED: Truck,
  PICKUP_READY: Package,
  DELIVERY_CONFIRMED: CheckCircle,
  SCHEDULE_CHANGED: Calendar,
  ISSUE_REPORTED: AlertTriangle,
  
  // Warehouse
  SHIPMENT_ARRIVING: Truck,
  STORAGE_FULL: AlertTriangle,
  BATCH_RECEIVED: Package,
  PACKAGING_COMPLETE: CheckCircle,
  QUALITY_CHECK_NEEDED: AlertTriangle,
  LOW_STOCK_ALERT: AlertTriangle,
  
  // General
  GENERAL: Bell,
  ANNOUNCEMENT: Bell,
  REMINDER: Clock,
  SYSTEM_ALERT: AlertTriangle,
};

export function UnifiedNotificationBell({ category, className }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Realtime updates
  const { unreadCount, refreshUnreadCount } = useRealtimeNotifications({ category });

  const loadNotifications = useMemo(() => {
    return async () => {
      setLoading(true);
      try {
        const notificationsData = await getMyNotifications(category);
        setNotifications(notificationsData as Notification[]);
        await refreshUnreadCount();
      } catch {
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
  }, [category, refreshUnreadCount]);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open, loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const result = await markNotificationAsRead(notificationId);
      if (result.success) {
        toast.success('Notification marked as read');
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        await refreshUnreadCount();
      } else {
        toast.error(result.error ?? 'Failed to mark as read');
      }
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await markAllNotificationsAsRead(category);
      if (result.success) {
        toast.success('All notifications marked as read');
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        await refreshUnreadCount();
      }
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    }

    if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    }

    return notificationDate.toLocaleDateString();
  };

  const getNotificationColor = (type: NotificationType) => {
    return notificationTypeColors[type] || notificationTypeColors.GENERAL;
  };

  const getCategoryTitle = () => {
    switch (category) {
      case 'TRANSPORT':
        return 'Transport Notifications';
      case 'WAREHOUSE':
        return 'Warehouse Notifications';
      default:
        return 'Notifications';
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn('relative', className)}
        onClick={() => setOpen(true)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" />
                {getCategoryTitle()}
              </DialogTitle>
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                  Mark all read
                </Button>
              )}
            </div>
            <DialogDescription>
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
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
                <p className="text-xs mt-1">We&apos;ll notify you when there&apos;s something important</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const IconComponent = notificationIcons[notification.type] || Bell;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 rounded-lg border transition-all',
                        notification.isRead
                          ? 'bg-gray-50 border-gray-200'
                          : 'bg-white border-blue-200 shadow-sm'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={cn(
                              'p-2 rounded-full flex-shrink-0',
                              getNotificationColor(notification.type)
                            )}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {notification.type.replace(/_/g, ' ')}
                              </Badge>
                              {notification.priority === 'HIGH' || notification.priority === 'URGENT' ? (
                                <Badge variant="destructive" className="text-xs">
                                  {notification.priority}
                                </Badge>
                              ) : null}
                              {!notification.isRead && (
                                <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>

                            <p className={cn('text-sm font-medium mb-1', !notification.isRead && 'text-gray-900')}>
                              {notification.title}
                            </p>

                            <p className={cn('text-sm text-gray-600 mb-2')}>
                              {notification.message}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{formatDate(notification.createdAt)}</span>
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
                            <Check className="h-4 w-4" />
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

// Convenience components for specific roles
export function TransportNotificationBell({ className }: { className?: string }) {
  return <UnifiedNotificationBell category="TRANSPORT" className={className} />;
}

export function WarehouseNotificationBell({ className }: { className?: string }) {
  return <UnifiedNotificationBell category="WAREHOUSE" className={className} />;
}
