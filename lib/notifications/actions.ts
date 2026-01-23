'use server'

import { getMyNotifications, getMyUnreadNotificationCount, markNotificationAsRead } from '@/lib/notifications/unified-actions';
import { NotificationCategory } from '@/lib/generated/prisma';

export async function getMyHarvestNotifications() {
  return getMyNotifications(NotificationCategory.CROP_MANAGEMENT);
}

export async function getMyUnreadHarvestNotificationCount() {
  return getMyUnreadNotificationCount(NotificationCategory.CROP_MANAGEMENT);
}

export async function markHarvestNotificationAsRead(notificationId: string) {
  return markNotificationAsRead(notificationId);
}
