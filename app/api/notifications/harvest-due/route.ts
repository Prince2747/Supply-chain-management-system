import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createBulkNotifications } from '@/lib/notifications/unified-actions';
import { NotificationCategory, NotificationType } from '@/lib/generated/prisma';

const DAYS_AHEAD = 7;

export async function POST(request: NextRequest) {
  try {
    const cronSecret = process.env.HARVEST_CRON_SECRET;
    if (cronSecret) {
      const headerSecret = request.headers.get('x-cron-secret');
      if (headerSecret !== cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const today = new Date();
    const windowEnd = new Date();
    windowEnd.setDate(today.getDate() + DAYS_AHEAD);

    const batches = await prisma.cropBatch.findMany({
      where: {
        expectedHarvest: {
          gte: today,
          lte: windowEnd,
        },
        status: {
          in: ['GROWING', 'READY_FOR_HARVEST'],
        },
      },
      select: {
        id: true,
        batchCode: true,
        expectedHarvest: true,
        createdBy: true,
        cropType: true,
      },
    });

    const notifications: Array<{
      userId: string;
      type: NotificationType;
      category: NotificationCategory;
      title: string;
      message: string;
      metadata: Record<string, any>;
    }> = [];

    for (const batch of batches) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId: batch.createdBy,
          type: NotificationType.HARVEST_READY,
          category: NotificationCategory.CROP_MANAGEMENT,
          metadata: {
            path: ['batchId'],
            equals: batch.id,
          },
          createdAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          },
        },
        select: { id: true },
      });

      if (existing) continue;

      const dueDate = batch.expectedHarvest ? batch.expectedHarvest.toLocaleDateString() : 'soon';
      notifications.push({
        userId: batch.createdBy,
        type: NotificationType.HARVEST_READY,
        category: NotificationCategory.CROP_MANAGEMENT,
        title: 'Harvest approaching',
        message: `Batch ${batch.batchCode} (${batch.cropType}) is approaching harvest (expected ${dueDate}). Please prepare to update status.`,
        metadata: {
          batchId: batch.id,
          batchCode: batch.batchCode,
          expectedHarvest: batch.expectedHarvest,
        },
      });
    }

    if (notifications.length > 0) {
      await createBulkNotifications(notifications);
    }

    return NextResponse.json({
      success: true,
      notified: notifications.length,
      scanned: batches.length,
    });
  } catch (error) {
    console.error('Error sending harvest due notifications:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
