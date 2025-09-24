import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/lib/activity-logger';

export async function POST(request: NextRequest) {
  try {
    const { userId, warehouseId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user is authenticated and is an admin
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if the target user exists and is a warehouse manager
    const targetUser = await prisma.profile.findUnique({
      where: { userId },
      select: { 
        id: true, 
        name: true, 
        role: true,
        warehouseId: true,
        warehouse: {
          select: { name: true }
        }
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (targetUser.role !== 'warehouse_manager') {
      return NextResponse.json(
        { error: 'Can only assign warehouses to warehouse managers' },
        { status: 400 }
      );
    }

    // If assigning a warehouse, verify it exists
    let warehouse = null;
    if (warehouseId) {
      warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId },
        select: { id: true, name: true, code: true }
      });

      if (!warehouse) {
        return NextResponse.json(
          { error: 'Warehouse not found' },
          { status: 404 }
        );
      }

      // Check if another manager is already assigned to this warehouse
      const existingAssignment = await prisma.profile.findFirst({
        where: {
          warehouseId,
          role: 'warehouse_manager',
          userId: { not: userId }
        },
        select: { name: true }
      });

      if (existingAssignment) {
        return NextResponse.json(
          { error: `Warehouse is already assigned to ${existingAssignment.name}` },
          { status: 400 }
        );
      }
    }

    // Update the warehouse assignment
    const updatedUser = await prisma.profile.update({
      where: { userId },
      data: { warehouseId },
      include: {
        warehouse: {
          select: { name: true, code: true }
        }
      }
    });

    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'WAREHOUSE_ASSIGNMENT',
      entityType: 'USER',
      entityId: userId,
      details: {
        targetUserId: userId,
        targetUserName: targetUser.name,
        warehouseId,
        warehouseName: warehouse?.name,
        previousWarehouseId: targetUser.warehouseId,
        previousWarehouseName: targetUser.warehouse?.name,
        message: warehouseId 
          ? `Assigned warehouse ${warehouse?.name} to ${targetUser.name}`
          : `Removed warehouse assignment from ${targetUser.name}`
      }
    });

    return NextResponse.json({
      message: 'Warehouse assignment updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error assigning warehouse:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}