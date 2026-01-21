import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/lib/activity-logger';
import { createBulkNotifications, notifyTransportCoordinator } from '@/lib/notifications/unified-actions';
import { NotificationCategory, NotificationType } from '@/lib/generated/prisma';

export async function POST(request: NextRequest) {
  try {
    const { batchId, storageLocation, notes } = await request.json();

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    // Verify user is authenticated and is a warehouse manager
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { role: true, name: true, warehouseId: true }
    });

    if (!profile || profile.role !== 'warehouse_manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    if (!profile.warehouseId) {
      return NextResponse.json(
        { error: 'No warehouse assigned' },
        { status: 403 }
      );
    }

    // Get current batch to check status
    const currentBatch = await prisma.cropBatch.findUnique({
      where: { id: batchId },
      include: {
        farm: {
          select: { name: true }
        }
      }
    });

    if (!currentBatch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Ensure batch belongs to manager's warehouse
    if (!currentBatch.warehouseId || currentBatch.warehouseId !== profile.warehouseId) {
      return NextResponse.json(
        { error: 'Batch does not belong to your warehouse' },
        { status: 403 }
      );
    }

    // Check if batch can be stored
    if (currentBatch.status !== 'RECEIVED') {
      return NextResponse.json(
        { error: `Cannot store batch in ${currentBatch.status} status. Only RECEIVED batches can be stored.` },
        { status: 400 }
      );
    }

    const noteFragments: string[] = [];
    if (storageLocation) noteFragments.push(`Storage location: ${storageLocation}`);
    if (notes) noteFragments.push(`Notes: ${notes}`);

    const appendedNotes = noteFragments.length
      ? `${currentBatch.notes ? `${currentBatch.notes} | ` : ''}${noteFragments.join(' | ')}`
      : currentBatch.notes ?? undefined;

    // Update the batch status to STORED
    const updatedBatch = await prisma.cropBatch.update({
      where: { id: batchId },
      data: { 
        status: 'STORED',
        updatedAt: new Date(),
        notes: appendedNotes,
      },
      include: {
        farm: {
          select: { name: true }
        }
      }
    });

    try {
      const latestTask = await prisma.transportTask.findFirst({
        where: { cropBatchId: batchId },
        orderBy: { updatedAt: 'desc' },
        include: {
          coordinator: { select: { userId: true } },
        },
      });

      const procurementOfficers = await prisma.profile.findMany({
        where: { role: 'procurement_officer', isActive: true },
        select: { userId: true },
      });

      if (procurementOfficers.length > 0) {
        await createBulkNotifications(
          procurementOfficers.map((po) => ({
            userId: po.userId,
            type: NotificationType.GENERAL,
            category: NotificationCategory.WAREHOUSE,
            title: 'Batch stored',
            message: `Batch ${updatedBatch.batchCode} has been stored in the warehouse${storageLocation ? ` (${storageLocation})` : ''}.`,
            metadata: {
              batchId,
              batchCode: updatedBatch.batchCode,
              storageLocation: storageLocation || null,
            },
          }))
        );
      }

      if (latestTask?.coordinator?.userId) {
        await notifyTransportCoordinator(
          latestTask.coordinator.userId,
          NotificationType.GENERAL,
          'Batch stored',
          `Batch ${updatedBatch.batchCode} has been stored in the warehouse${storageLocation ? ` (${storageLocation})` : ''}.`,
          { batchId, batchCode: updatedBatch.batchCode, storageLocation: storageLocation || null }
        );
      }
    } catch (e) {
      console.warn('Failed to notify on storage update:', e);
    }

    // Log the storage activity
    await logActivity({
      userId: user.id,
      action: 'BATCH_STORAGE_UPDATE',
      details: {
        message: `Updated batch ${updatedBatch.batchCode} status to STORED`,
        role: profile.role,
        statusFrom: currentBatch.status,
        statusTo: 'STORED',
        storageLocation: storageLocation || null,
      },
      entityType: 'CropBatch',
      entityId: batchId
    });

    return NextResponse.json({
      message: 'Batch stored successfully',
      batch: updatedBatch
    });

  } catch (error) {
    console.error('Error updating storage status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}