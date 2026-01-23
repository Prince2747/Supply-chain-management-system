'use client';

import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

export function useRealtimeHarvestNotifications() {
  return useRealtimeNotifications({ category: 'CROP_MANAGEMENT' });
}
