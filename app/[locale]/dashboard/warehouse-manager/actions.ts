'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/lib/activity-logger';
import {
  notifyTransportCoordinator,
  createBulkNotifications,
} from '@/lib/notifications/unified-actions';
import { NotificationCategory, NotificationType } from '@/lib/generated/prisma';

const DASHBOARD_LOCALES = ['en', 'am'] as const;

function revalidateDashboardPath(pathWithoutLocale: string) {
  for (const locale of DASHBOARD_LOCALES) {
    revalidatePath(`/${locale}${pathWithoutLocale}`);
  }
}

async function getWarehouseManagerContext() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { error: 'Unauthorized' as const, user: null, profile: null };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true, name: true, warehouseId: true }
  });

  if (!profile || profile.role !== 'warehouse_manager') {
    return { error: 'Insufficient permissions' as const, user: null, profile: null };
  }

  if (!profile.warehouseId) {
    return { error: 'No warehouse assigned' as const, user: null, profile: null };
  }

  return { error: null, user, profile };
}

function extractCodes(raw: unknown): { qrCode?: string; batchCode?: string } {
  if (typeof raw !== 'string') return {};
  const trimmed = raw.trim();
  if (!trimmed) return {};

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      const qrCode = typeof (parsed as any).qrCode === 'string' ? (parsed as any).qrCode.trim() : undefined;
      const batchCode = typeof (parsed as any).batchCode === 'string' ? (parsed as any).batchCode.trim() : undefined;
      return { qrCode, batchCode };
    }
  } catch {
    // not JSON
  }

  return { qrCode: trimmed, batchCode: trimmed };
}

export async function updatePackagingStatus(batchId: string, status: string) {
  try {
    if (!batchId || !status) {
      return { error: 'Batch ID and status are required' };
    }

    const ctx = await getWarehouseManagerContext();
    if (ctx.error || !ctx.user || !ctx.profile) {
      return { error: ctx.error || 'Unauthorized' };
    }

    const validStatuses = ['PACKAGING', 'PACKAGED'] as const;
    if (!validStatuses.includes(status as any)) {
      return { error: 'Invalid status' };
    }

    const currentBatch = await prisma.cropBatch.findUnique({
      where: { id: batchId },
      select: { status: true, batchCode: true, warehouseId: true }
    });

    if (!currentBatch) {
      return { error: 'Batch not found' };
    }

    if (currentBatch.warehouseId !== ctx.profile.warehouseId) {
      return { error: 'Batch does not belong to your warehouse' };
    }

    const validTransitions: Record<string, string[]> = {
      READY_FOR_PACKAGING: ['PACKAGING'],
      PACKAGING: ['PACKAGED'],
    };
    const allowed = validTransitions[currentBatch.status] || [];
    if (!allowed.includes(status)) {
      return { error: `Cannot transition from ${currentBatch.status} to ${status}` };
    }

    const updatedBatch = await prisma.cropBatch.update({
      where: { id: batchId },
      data: { status, updatedAt: new Date() },
      include: { farm: { select: { name: true } } }
    });

    await logActivity({
      userId: ctx.user.id,
      action: 'PACKAGING_STATUS_UPDATE',
      details: `Updated packaging status of batch ${updatedBatch.batchCode} from ${currentBatch.status} to ${status}`,
      entityType: 'CropBatch',
      entityId: batchId
    });

    revalidateDashboardPath('/dashboard/warehouse-manager/packaging');
    return { success: true, message: 'Packaging status updated successfully' };
  } catch (error) {
    console.error('Error updating packaging status:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function verifyBatch(batchCode: string) {
  try {
    const ctx = await getWarehouseManagerContext();
    if (ctx.error || !ctx.user || !ctx.profile) {
      return { error: ctx.error || 'Unauthorized' };
    }

    const rawInput = (batchCode || '').trim();
    const { qrCode, batchCode: extractedBatchCode } = extractCodes(rawInput);
    if (!qrCode && !extractedBatchCode) {
      return { error: 'QR code or batch code is required' };
    }

    const batch = await prisma.cropBatch.findFirst({
      where: {
        OR: [
          ...(qrCode ? [{ qrCode }] : []),
          ...(extractedBatchCode ? [{ batchCode: extractedBatchCode }] : []),
        ],
      },
      include: {
        farm: { select: { name: true, location: true } },
        transportTasks: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          include: {
            vehicle: { select: { plateNumber: true, type: true } },
            driver: { select: { name: true, phone: true } }
          }
        }
      }
    });

    if (!batch) {
      return { error: 'Batch not found' };
    }

    if (!batch.warehouseId || batch.warehouseId !== ctx.profile.warehouseId) {
      return { error: 'Batch does not belong to your warehouse' };
    }

    if (batch.transportTasks.length === 0) {
      return { error: 'No transport task found for this batch yet. Please ask the transport coordinator to schedule shipment.' };
    }

    if (batch.status !== 'SHIPPED' && batch.status !== 'PACKAGED') {
      return { error: `Batch is in ${batch.status} status. Only SHIPPED (or PACKAGED) batches can be received.` };
    }

    await logActivity({
      userId: ctx.user.id,
      action: 'BATCH_VERIFICATION',
      details: `Verified batch ${batch.batchCode} for receipt at warehouse`,
      entityType: 'CropBatch',
      entityId: batch.id
    });

    const deliveredTask = batch.transportTasks[0];

    return {
      success: true,
      batch: {
        id: batch.id,
        batchCode: batch.batchCode,
        cropType: batch.cropType,
        quantity: batch.quantity,
        status: batch.status,
        harvestDate: batch.actualHarvest,
        farm: {
          name: batch.farm.name,
          location: batch.farm.location,
        },
        transportTask: deliveredTask ? {
          id: deliveredTask.id,
          driver: {
            name: deliveredTask.driver.name,
            phone: deliveredTask.driver.phone,
          },
          vehicle: {
            plateNumber: deliveredTask.vehicle.plateNumber,
            type: deliveredTask.vehicle.type,
          },
          actualDeliveryDate: deliveredTask.actualDeliveryDate,
        } : undefined,
      }
    };
  } catch (error) {
    console.error('Error verifying batch:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function confirmBatchReceipt(batchId: string) {
  try {
    if (!batchId) {
      return { error: 'Batch ID is required' };
    }

    // Enforce QR-only receipt confirmation.
    return { error: 'Receipt confirmations must be done via QR code scanning.' };

    const ctx = await getWarehouseManagerContext();
    if (ctx.error || !ctx.user || !ctx.profile) {
      return { error: ctx.error || 'Unauthorized' };
    }

    const currentBatch = await prisma.cropBatch.findUnique({
      where: { id: batchId },
      include: { farm: { select: { name: true } } }
    });

    if (!currentBatch) {
      return { error: 'Batch not found' };
    }

    if (!currentBatch.warehouseId || currentBatch.warehouseId !== ctx.profile.warehouseId) {
      return { error: 'Batch does not belong to your warehouse' };
    }

    if (currentBatch.status !== 'SHIPPED' && currentBatch.status !== 'PACKAGED') {
      return { error: `Cannot receive batch in ${currentBatch.status} status. Only SHIPPED (or PACKAGED) batches can be received.` };
    }

    const updatedBatch = await prisma.cropBatch.update({
      where: { id: batchId },
      data: { status: 'RECEIVED', updatedAt: new Date() },
      include: { farm: { select: { name: true } } }
    });

    // Notify transport coordinator (latest task) and procurement officers that the batch has been received.
    try {
      const latestTask = await prisma.transportTask.findFirst({
        where: { cropBatchId: batchId },
        orderBy: { updatedAt: 'desc' },
        include: {
          coordinator: { select: { userId: true, name: true } },
        },
      });

      if (latestTask?.coordinator?.userId) {
        await notifyTransportCoordinator(
          latestTask.coordinator.userId,
          NotificationType.BATCH_RECEIVED,
          'Received at warehouse',
          `Batch ${updatedBatch.batchCode} has been received at the warehouse.`,
          { batchId, batchCode: updatedBatch.batchCode }
        );
      }

      const procurementOfficers = await prisma.profile.findMany({
        where: { role: 'procurement_officer', isActive: true },
        select: { userId: true },
      });

      if (procurementOfficers.length > 0) {
        await createBulkNotifications(
          procurementOfficers.map((po) => ({
            userId: po.userId,
            type: NotificationType.BATCH_RECEIVED,
            category: NotificationCategory.WAREHOUSE,
            title: 'Received at warehouse',
            message: `Batch ${updatedBatch.batchCode} has been received at the warehouse.`,
            metadata: { batchId, batchCode: updatedBatch.batchCode },
          }))
        );
      }
    } catch (e) {
      console.warn('Failed to send receipt notifications:', e);
    }

    await logActivity({
      userId: ctx.user.id,
      action: 'BATCH_RECEIPT_CONFIRMATION',
      details: {
        message: `Confirmed receipt of batch ${updatedBatch.batchCode} at warehouse`,
        role: ctx.profile.role,
        statusFrom: currentBatch.status,
        statusTo: 'RECEIVED',
        receiptMethod: 'qr_scan',
      },
      entityType: 'CropBatch',
      entityId: batchId
    });

    revalidateDashboardPath('/dashboard/warehouse-manager/scanner');
    revalidateDashboardPath('/dashboard/warehouse-manager/storage');
    return { success: true, message: 'Batch receipt confirmed successfully' };
  } catch (error) {
    console.error('Error confirming batch receipt:', error);
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateStorageStatus(batchId: string, storageLocation?: string, notes?: string) {
  try {
    if (!batchId) {
      return { error: 'Batch ID is required' };
    }

    const ctx = await getWarehouseManagerContext();
    if (ctx.error || !ctx.user || !ctx.profile) {
      return { error: ctx.error || 'Unauthorized' };
    }

    const currentBatch = await prisma.cropBatch.findUnique({
      where: { id: batchId },
      include: { farm: { select: { name: true } } }
    });

    if (!currentBatch) {
      return { error: 'Batch not found' };
    }

    if (!currentBatch.warehouseId || currentBatch.warehouseId !== ctx.profile.warehouseId) {
      return { error: 'Batch does not belong to your warehouse' };
    }

    if (currentBatch.status !== 'RECEIVED') {
      return { error: `Cannot store batch in ${currentBatch.status} status. Only RECEIVED batches can be stored.` };
    }

    const noteFragments: string[] = [];
    if (storageLocation) noteFragments.push(`Storage location: ${storageLocation}`);
    if (notes) noteFragments.push(`Notes: ${notes}`);

    const appendedNotes = noteFragments.length
      ? `${currentBatch.notes ? `${currentBatch.notes} | ` : ''}${noteFragments.join(' | ')}`
      : currentBatch.notes ?? undefined;

    const updatedBatch = await prisma.cropBatch.update({
      where: { id: batchId },
      data: {
        status: 'STORED',
        updatedAt: new Date(),
        notes: appendedNotes,
      },
      include: { farm: { select: { name: true } } }
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

    await logActivity({
      userId: ctx.user.id,
      action: 'BATCH_STORAGE_UPDATE',
      details: {
        message: `Updated batch ${updatedBatch.batchCode} status to STORED${storageLocation ? ` (location: ${storageLocation})` : ''}${notes ? ` (notes: ${notes})` : ''}`,
        role: ctx.profile.role,
        statusFrom: currentBatch.status,
        statusTo: 'STORED',
        storageLocation: storageLocation || null,
      },
      entityType: 'CropBatch',
      entityId: batchId
    });

    revalidateDashboardPath('/dashboard/warehouse-manager/storage');
    revalidateDashboardPath('/dashboard/warehouse-manager');
    return { success: true, message: 'Batch stored successfully' };
  } catch (error) {
    console.error('Error updating storage status:', error);
    return { error: 'An unexpected error occurred' };
  }
}