import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const { batchId } = await request.json();

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

    // Check if batch can be received
    if (currentBatch.status !== 'SHIPPED' && currentBatch.status !== 'PACKAGED') {
      return NextResponse.json(
        { error: `Cannot receive batch in ${currentBatch.status} status. Only SHIPPED (or PACKAGED) batches can be received.` },
        { status: 400 }
      );
    }

    // Update the batch status to RECEIVED
    const updatedBatch = await prisma.cropBatch.update({
      where: { id: batchId },
      data: { 
        status: 'RECEIVED',
        updatedAt: new Date()
      },
      include: {
        farm: {
          select: { name: true }
        }
      }
    });

    // Notify transport coordinator (latest task) and procurement officers that the batch has been received.
    try {
      const latestTask = await prisma.transportTask.findFirst({
        where: { cropBatchId: batchId },
        orderBy: { updatedAt: 'desc' },
        include: {
          coordinator: { select: { userId: true } },
        },
      });

      if (latestTask?.coordinator?.userId) {
        await prisma.harvestNotification.create({
          data: {
            cropBatchId: batchId,
            sentTo: latestTask.coordinator.userId,
            isRead: false,
            notificationType: 'GENERAL',
            message: `Warehouse receipt confirmed: Batch ${updatedBatch.batchCode} has been received at the warehouse.`,
          },
        });
      }

      const procurementOfficers = await prisma.profile.findMany({
        where: { role: 'procurement_officer', isActive: true },
        select: { userId: true },
      });

      if (procurementOfficers.length > 0) {
        await prisma.harvestNotification.createMany({
          data: procurementOfficers.map((po) => ({
            cropBatchId: batchId,
            sentTo: po.userId,
            isRead: false,
            notificationType: 'GENERAL',
            message: `Batch received: Batch ${updatedBatch.batchCode} has arrived at the warehouse.`,
          })),
        });
      }
    } catch (e) {
      console.warn('Failed to send receipt notifications:', e);
    }

    // Log the receipt confirmation activity
    await logActivity({
      userId: user.id,
      action: 'BATCH_RECEIPT_CONFIRMATION',
      details: `Confirmed receipt of batch ${updatedBatch.batchCode} at warehouse`,
      entityType: 'CropBatch',
      entityId: batchId
    });

    return NextResponse.json({
      message: 'Batch receipt confirmed successfully',
      batch: updatedBatch
    });

  } catch (error) {
    console.error('Error confirming batch receipt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}