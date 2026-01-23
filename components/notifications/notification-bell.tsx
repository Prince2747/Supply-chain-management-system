'use client';

import { UnifiedNotificationBell } from '@/components/notifications/unified-notification-bell';

export function NotificationBell({ className }: { className?: string }) {
  return <UnifiedNotificationBell className={className} />;
}
