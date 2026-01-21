import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/lib/activity-logger';
import { createBulkNotifications, notifyTransportCoordinator } from '@/lib/notifications/unified-actions'
import { NotificationCategory, NotificationType } from '@/lib/generated/prisma'

export async function POST(request: NextRequest) {
  try {
    const { batchId, decision, receivedQuantity, issueType, notes } = await request.json();

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
      select: {
        id: true,
        batchCode: true,
        cropType: true,
        quantity: true,
        status: true,
        warehouseId: true,
        notes: true,
        createdBy: true,
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

    const normalizedDecision = decision === 'reject' ? 'reject' : 'accept';
    const expectedQuantity = currentBatch.quantity || 0;
    const normalizedReceivedQty = typeof receivedQuantity === 'number' && Number.isFinite(receivedQuantity)
      ? receivedQuantity
      : null;
    const isUnderweight = normalizedReceivedQty !== null && expectedQuantity > 0 && normalizedReceivedQty < expectedQuantity;
    const normalizedIssueType = typeof issueType === 'string' && issueType.trim() ? issueType.trim() : null;
    const normalizedNotes = typeof notes === 'string' && notes.trim() ? notes.trim() : null;

    const noteFragments: string[] = [];
    if (normalizedReceivedQty !== null) noteFragments.push(`Received quantity: ${normalizedReceivedQty}kg`);
    if (normalizedIssueType) noteFragments.push(`Issue: ${normalizedIssueType}`);
    if (normalizedNotes) noteFragments.push(`Notes: ${normalizedNotes}`);

    const appendedNotes = noteFragments.length
      ? `${currentBatch.notes ? `${currentBatch.notes} | ` : ''}${noteFragments.join(' | ')}`
      : currentBatch.notes ?? undefined;

    const updateData: any = {
      updatedAt: new Date(),
      notes: appendedNotes,
    };

    if (normalizedDecision === 'accept') {
      updateData.status = 'RECEIVED';
    }

    // Update the batch status for accepted receipts; rejected keeps status as SHIPPED.
    const updatedBatch = await prisma.cropBatch.update({
      where: { id: batchId },
      data: updateData,
      include: {
        farm: {
          select: { name: true }
        }
      }
    });

    // Notify transport coordinator / procurement officers based on decision
    try {
      const latestTask = await prisma.transportTask.findFirst({
        where: { cropBatchId: batchId },
        orderBy: { updatedAt: 'desc' },
        include: {
          coordinator: { select: { userId: true } },
          driver: {
            select: {
              name: true,
              profileId: true,
              Profile: { select: { userId: true } },
            },
          },
        },
      });

      const procurementOfficers = await prisma.profile.findMany({
        where: { role: 'procurement_officer', isActive: true },
        select: { userId: true },
      });

      if (normalizedDecision === 'accept') {
        if (latestTask?.coordinator?.userId) {
          await notifyTransportCoordinator(
            latestTask.coordinator.userId,
            NotificationType.BATCH_RECEIVED,
            'Received at warehouse',
            `Batch ${updatedBatch.batchCode} has been received at the warehouse.`,
            { batchId, batchCode: updatedBatch.batchCode }
          );
        }

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
          )
        }

        if ((isUnderweight || normalizedIssueType || normalizedNotes) && procurementOfficers.length > 0) {
          const issueMessage = isUnderweight
            ? `Batch ${updatedBatch.batchCode} received under expected quantity (${normalizedReceivedQty} < ${expectedQuantity}).`
            : `Batch ${updatedBatch.batchCode} received with issue: ${normalizedIssueType || 'Issue noted'}.`;

          await createBulkNotifications(
            procurementOfficers.map((po) => ({
              userId: po.userId,
              type: NotificationType.QUALITY_CHECK_NEEDED,
              category: NotificationCategory.WAREHOUSE,
              title: 'Received with issue',
              message: `${issueMessage}${normalizedNotes ? ` Notes: ${normalizedNotes}` : ''}`,
              metadata: {
                batchId,
                batchCode: updatedBatch.batchCode,
                receivedQuantity: normalizedReceivedQty,
                expectedQuantity,
                issueType: normalizedIssueType,
              },
            }))
          )
        }
      } else {
        // Rejected: notify procurement, coordinator, driver, and field agent
        const rejectionMessage = `Batch ${updatedBatch.batchCode} was rejected at warehouse.${normalizedNotes ? ` Notes: ${normalizedNotes}` : ''}`;

        if (procurementOfficers.length > 0) {
          await createBulkNotifications(
            procurementOfficers.map((po) => ({
              userId: po.userId,
              type: NotificationType.QUALITY_CHECK_NEEDED,
              category: NotificationCategory.WAREHOUSE,
              title: 'Batch rejected at warehouse',
              message: rejectionMessage,
              metadata: { batchId, batchCode: updatedBatch.batchCode, issueType: normalizedIssueType },
            }))
          );
        }

        if (latestTask?.coordinator?.userId) {
          await notifyTransportCoordinator(
            latestTask.coordinator.userId,
            NotificationType.ISSUE_REPORTED,
            'Batch rejected',
            `Batch ${updatedBatch.batchCode} was rejected at warehouse. Please return it to pickup location.`,
            { batchId, batchCode: updatedBatch.batchCode, issueType: normalizedIssueType }
          );
        }

        if (latestTask?.driver?.Profile?.userId) {
          await createBulkNotifications([
            {
              userId: latestTask.driver.Profile.userId,
              type: NotificationType.ISSUE_REPORTED,
              category: NotificationCategory.TRANSPORT,
              title: 'Return batch to pickup',
              message: `Batch ${updatedBatch.batchCode} was rejected. Please return it to the pickup location.`,
              metadata: { batchId, batchCode: updatedBatch.batchCode, issueType: normalizedIssueType },
            },
          ]);
        }

        if (currentBatch.createdBy) {
          await createBulkNotifications([
            {
              userId: currentBatch.createdBy,
              type: NotificationType.SYSTEM_ALERT,
              category: NotificationCategory.CROP_MANAGEMENT,
              title: 'Batch rejected at warehouse',
              message: rejectionMessage,
              metadata: { batchId, batchCode: updatedBatch.batchCode, issueType: normalizedIssueType },
            },
          ]);
        }
      }
    } catch (e) {
      console.warn('Failed to send receipt notifications:', e);
    }

    // Log the receipt confirmation activity
    await logActivity({
      userId: user.id,
      action: 'BATCH_RECEIPT_CONFIRMATION',
      details: {
        message: `${normalizedDecision === 'accept' ? 'Confirmed receipt' : 'Rejected'} batch ${updatedBatch.batchCode} at warehouse`,
        role: profile.role,
        statusFrom: currentBatch.status,
        statusTo: normalizedDecision === 'accept' ? 'RECEIVED' : currentBatch.status,
        receiptMethod: 'qr_scan',
        decision: normalizedDecision,
        receivedQuantity: normalizedReceivedQty,
        expectedQuantity,
        issueType: normalizedIssueType,
        notes: normalizedNotes,
      },
      entityType: 'CropBatch',
      entityId: batchId
    });

    return NextResponse.json({
      message: normalizedDecision === 'accept' ? 'Batch receipt confirmed successfully' : 'Batch rejected and return initiated',
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