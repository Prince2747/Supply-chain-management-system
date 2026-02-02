'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { getMyUnreadNotificationCount } from '@/lib/notifications/unified-actions';
import { NotificationCategory } from '@/lib/generated/prisma';

type RealtimePayload = {
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: any;
  old?: any;
};

type UseRealtimeNotificationsOptions = {
  category?: NotificationCategory;
  showToast?: boolean;
};

export function useRealtimeNotifications(options: UseRealtimeNotificationsOptions = {}) {
  const { category, showToast = true } = options;
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ready, setReady] = useState(false);

  const refreshUnreadCount = useCallback(async () => {
    const count = await getMyUnreadNotificationCount(category);
    setUnreadCount(count);
    return count;
  }, [category]);

  // Initial load
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
  }, [refreshUnreadCount]);

  // Subscribe to realtime updates
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null;
    let cancelled = false;

    async function subscribe() {
      const supabase = supabaseRef.current ?? (supabaseRef.current = createClient());
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;

      // Subscribe to the unified Notification table
      channel = supabase
        .channel(`notifications:${user.id}${category ? `:${category}` : ''}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'Notification',
            filter: `userId=eq.${user.id}`,
          },
          (payload: RealtimePayload) => {
            const notification = payload.new;
            if (!notification) return;
            
            // Filter by category if specified
            if (category && notification.category !== category) return;

            // Refresh count
            void refreshUnreadCount();

            // Show toast for new notifications
            if (showToast) {
              toast(notification.title || 'New Notification', {
                description: notification.message,
                duration: 5000,
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'Notification',
            filter: `userId=eq.${user.id}`,
          },
          () => {
            // Sync unread count when notifications are marked read
            void refreshUnreadCount();
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'Notification',
            filter: `userId=eq.${user.id}`,
          },
          () => {
            void refreshUnreadCount();
          }
        )
        .subscribe();

      // Broadcast support for realtime.broadcast_changes
      (channel as any)
        .on('broadcast', { event: 'INSERT' }, (payload: any) => {
          void refreshUnreadCount();

          const row = payload?.payload?.NEW ?? payload?.NEW ?? payload?.new;
          if (row?.message && showToast) {
            // Filter by category if specified
            if (category && row.category !== category) return;
            
            toast(row.title || 'New Notification', {
              description: row.message,
              duration: 5000,
            });
          }
        })
        .on('broadcast', { event: 'UPDATE' }, () => void refreshUnreadCount())
        .on('broadcast', { event: 'DELETE' }, () => void refreshUnreadCount());
    }

    subscribe();

    return () => {
      cancelled = true;
      const supabase = supabaseRef.current;
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [category, refreshUnreadCount, showToast]);

  return {
    unreadCount,
    setUnreadCount,
    refreshUnreadCount,
    ready,
  };
}

// Convenience hooks for specific roles
export function useTransportNotifications() {
  return useRealtimeNotifications({ category: 'TRANSPORT' });
}

export function useWarehouseNotifications() {
  return useRealtimeNotifications({ category: 'WAREHOUSE' });
}
