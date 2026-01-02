'use server'

import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function getMyHarvestNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  return prisma.harvestNotification.findMany({
    where: {
      sentTo: user.id,
    },
    include: {
      cropBatch: {
        select: {
          batchCode: true,
          cropType: true,
          status: true,
          farm: {
            select: {
              name: true,
              farmCode: true,
            },
          },
          farmer: {
            select: {
              name: true,
              farmerId: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMyUnreadHarvestNotificationCount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  return prisma.harvestNotification.count({
    where: {
      sentTo: user.id,
      isRead: false,
    },
  });
}

export async function markHarvestNotificationAsRead(notificationId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' } as const;
  }

  const result = await prisma.harvestNotification.updateMany({
    where: {
      id: notificationId,
      sentTo: user.id,
    },
    data: {
      isRead: true,
    },
  });

  if (result.count === 0) {
    return { success: false, error: 'Notification not found' } as const;
  }

  return { success: true } as const;
}
