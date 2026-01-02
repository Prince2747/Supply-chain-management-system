import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/lib/activity-logger';

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

    // Update the batch status to STORED
    const updatedBatch = await prisma.cropBatch.update({
      where: { id: batchId },
      data: { 
        status: 'STORED',
        updatedAt: new Date()
      },
      include: {
        farm: {
          select: { name: true }
        }
      }
    });

    // Log the storage activity
    await logActivity({
      userId: user.id,
      action: 'BATCH_STORAGE_UPDATE',
      details: `Updated batch ${updatedBatch.batchCode} status to STORED`,
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