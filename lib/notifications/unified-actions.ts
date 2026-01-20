'use server'

import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { NotificationCategory, NotificationType, NotificationPriority } from '@/lib/generated/prisma';

// Types for notification creation
export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  actionUrl?: string;
  priority?: NotificationPriority;
  createdBy?: string;
  expiresAt?: Date;
};

// Get current user's notifications
export async function getMyNotifications(category?: NotificationCategory) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  return prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(category && { category }),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

// Get unread notification count
export async function getMyUnreadNotificationCount(category?: NotificationCategory) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  return prisma.notification.count({
    where: {
      userId: user.id,
      isRead: false,
      ...(category && { category }),
    },
  });
}

// Mark notification as read
export async function markNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' } as const;
  }

  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: user.id,
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  if (result.count === 0) {
    return { success: false, error: 'Notification not found' } as const;
  }

  return { success: true } as const;
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(category?: NotificationCategory) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' } as const;
  }

  await prisma.notification.updateMany({
    where: {
      userId: user.id,
      isRead: false,
      ...(category && { category }),
    },
    data: {
      isRead: true,
      readAt: new Date(),
    },
  });

  return { success: true } as const;
}

// Create a notification
export async function createNotification(input: CreateNotificationInput) {
  return prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      category: input.category,
      title: input.title,
      message: input.message,
      metadata: input.metadata,
      actionUrl: input.actionUrl,
      priority: input.priority ?? 'NORMAL',
      createdBy: input.createdBy,
      expiresAt: input.expiresAt,
    },
  });
}

// Create multiple notifications (broadcast)
export async function createBulkNotifications(notifications: CreateNotificationInput[]) {
  return prisma.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      type: n.type,
      category: n.category,
      title: n.title,
      message: n.message,
      metadata: n.metadata,
      actionUrl: n.actionUrl,
      priority: n.priority ?? 'NORMAL',
      createdBy: n.createdBy,
      expiresAt: n.expiresAt,
    })),
  });
}

// Delete a notification
export async function deleteNotification(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' } as const;
  }

  const result = await prisma.notification.deleteMany({
    where: {
      id: notificationId,
      userId: user.id,
    },
  });

  if (result.count === 0) {
    return { success: false, error: 'Notification not found' } as const;
  }

  return { success: true } as const;
}

// ============================================
// Role-specific notification helpers
// ============================================

// Transport Coordinator: Notify about new transport tasks
export async function notifyTransportCoordinator(
  coordinatorId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>,
  actionUrl?: string
) {
  return createNotification({
    userId: coordinatorId,
    type,
    category: 'TRANSPORT',
    title,
    message,
    metadata,
    actionUrl,
  });
}

// Transport Driver: Notify about task assignments
export async function notifyTransportDriver(
  driverId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>,
  actionUrl?: string
) {
  return createNotification({
    userId: driverId,
    type,
    category: 'TRANSPORT',
    title,
    message,
    metadata,
    actionUrl,
  });
}

// Warehouse Manager: Notify about shipments and storage
export async function notifyWarehouseManager(
  managerId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>,
  actionUrl?: string
) {
  return createNotification({
    userId: managerId,
    type,
    category: 'WAREHOUSE',
    title,
    message,
    metadata,
    actionUrl,
  });
}

// Notify all warehouse managers in a warehouse
export async function notifyAllWarehouseManagers(
  warehouseId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: Record<string, any>,
  actionUrl?: string
) {
  const managers = await prisma.profile.findMany({
    where: {
      warehouseId,
      role: 'warehouse_manager',
      isActive: true,
    },
    select: { userId: true },
  });

  const notifications = managers.map((m) => ({
    userId: m.userId,
    type,
    category: 'WAREHOUSE' as NotificationCategory,
    title,
    message,
    metadata,
    actionUrl,
  }));

  return createBulkNotifications(notifications);
}
