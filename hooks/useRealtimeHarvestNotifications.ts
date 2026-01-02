'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { getMyUnreadHarvestNotificationCount } from '@/lib/notifications/actions';

type RealtimePayload = {
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
};

export function useRealtimeHarvestNotifications() {
  const supabase = useMemo(() => createClient(), []);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ready, setReady] = useState(false);

  const refreshUnreadCount = useMemo(() => {
    return async () => {
      const count = await getMyUnreadHarvestNotificationCount();
      setUnreadCount(count);
      return count;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        if (!cancelled) await refreshUnreadCount();
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function subscribe() {
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      // NOTE: Prisma model name is "HarvestNotification"; this table name must match your DB.
      channel = supabase
        // Matches your DB trigger broadcast topic: user_notifications:{sentTo}
        .channel(`user_notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'HarvestNotification',
            filter: `sentTo=eq.${user.id}`,
          },
          (payload: RealtimePayload) => {
            const notification = payload.new;
            if (!notification) return;

            // Keep count correct even if multiple tabs/devices
            void refreshUnreadCount();

            // Lightweight toast for new notifications
            toast(notification.notificationType?.replace(/_/g, ' ') || 'Notification', {
              description: notification.message,
              duration: 5000,
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'HarvestNotification',
            filter: `sentTo=eq.${user.id}`,
          },
          () => {
            // Sync unread count when notifications are marked read elsewhere
            void refreshUnreadCount();
          }
        )
        .subscribe();

      // Broadcast support (for realtime.broadcast_changes)
      // Your trigger emits event names: INSERT and UPDATE (uppercase)
      // NOTE: The @supabase/ssr client types are sometimes overly strict here, so we cast.
      (channel as any)
        .on('broadcast', { event: 'INSERT' }, (payload: any) => {
          void refreshUnreadCount();

          const row = payload?.payload?.NEW ?? payload?.NEW ?? payload?.new;
          if (row?.message) {
            toast(row.notificationType?.replace(/_/g, ' ') || 'Notification', {
              description: row.message,
              duration: 5000,
            });
          }
        })
        .on('broadcast', { event: 'UPDATE' }, () => void refreshUnreadCount());
    }

    subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase]);

  return {
    unreadCount,
    setUnreadCount,
    refreshUnreadCount,
    ready,
  };
}
