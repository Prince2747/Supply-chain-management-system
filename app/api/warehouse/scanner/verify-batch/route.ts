import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const { batchCode } = await request.json();

    if (!batchCode) {
      return NextResponse.json(
        { error: 'Batch code is required' },
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
      select: { role: true, name: true }
    });

    if (!profile || profile.role !== 'warehouse_manager') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Find the batch by batch code
    const batch = await prisma.cropBatch.findUnique({
      where: { batchCode },
      include: {
        farm: {
          select: { name: true }
        },
        transportTasks: {
          where: {
            status: 'DELIVERED'
          },
          include: {
            vehicle: {
              select: { plateNumber: true }
            },
            driver: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Check if batch has been delivered
    if (batch.transportTasks.length === 0) {
      return NextResponse.json(
        { error: 'Batch has not been delivered yet' },
        { status: 400 }
      );
    }

    // Check if batch is in correct status for receiving
    if (batch.status !== 'PACKAGED') {
      return NextResponse.json(
        { error: `Batch is in ${batch.status} status. Only PACKAGED batches can be received.` },
        { status: 400 }
      );
    }

    // Log the verification activity
    await logActivity({
      userId: user.id,
      action: 'BATCH_VERIFICATION',
      details: `Verified batch ${batch.batchCode} for receipt at warehouse`,
      entityType: 'CropBatch',
      entityId: batch.id
    });

    return NextResponse.json({
      message: 'Batch verified successfully',
      batch: {
        id: batch.id,
        batchCode: batch.batchCode,
        farmName: batch.farm.name,
        quantity: batch.quantity,
        unit: batch.unit,
        status: batch.status,
        actualHarvest: batch.actualHarvest,
        deliveryInfo: batch.transportTasks[0] ? {
          vehiclePlateNumber: batch.transportTasks[0].vehicle.plateNumber,
          driverName: batch.transportTasks[0].driver.name,
          deliveredAt: batch.transportTasks[0].updatedAt
        } : null
      }
    });

  } catch (error) {
    console.error('Error verifying batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}