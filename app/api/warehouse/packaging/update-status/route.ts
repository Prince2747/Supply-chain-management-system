import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const { batchId, status } = await request.json();

    if (!batchId || !status) {
      return NextResponse.json(
        { error: 'Batch ID and status are required' },
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
      select: { 
        role: true, 
        name: true, 
        warehouseId: true,
        warehouse: {
          select: { name: true }
        }
      }
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

    // Validate status transition
    const validStatuses = ['PACKAGING', 'PACKAGED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get current batch to check current status and warehouse
    const currentBatch = await prisma.cropBatch.findUnique({
      where: { id: batchId },
      select: { 
        status: true, 
        batchCode: true,
        warehouseId: true
      }
    });

    if (!currentBatch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Ensure batch belongs to manager's warehouse
    if (currentBatch.warehouseId !== profile.warehouseId) {
      return NextResponse.json(
        { error: 'Batch does not belong to your warehouse' },
        { status: 403 }
      );
    }

    // Validate status transition logic
    const validTransitions = {
      'READY_FOR_PACKAGING': ['PACKAGING'],
      'PACKAGING': ['PACKAGED']
    };

    const allowedNextStatuses = validTransitions[currentBatch.status as keyof typeof validTransitions];
    if (!allowedNextStatuses?.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentBatch.status} to ${status}` },
        { status: 400 }
      );
    }

    // Update the batch status
    const updatedBatch = await prisma.cropBatch.update({
      where: { id: batchId },
      data: { 
        status,
        updatedAt: new Date()
      },
      include: {
        farm: {
          select: { name: true }
        }
      }
    });

    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'PACKAGING_STATUS_UPDATE',
      details: `Updated packaging status of batch ${updatedBatch.batchCode} from ${currentBatch.status} to ${status}`,
      entityType: 'CropBatch',
      entityId: batchId
    });

    return NextResponse.json({
      message: 'Packaging status updated successfully',
      batch: updatedBatch
    });

  } catch (error) {
    console.error('Error updating packaging status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}