import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-logger';

async function checkAdminPermission() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'You must be logged in.', user: null };
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can perform this action.', user: null };
  }

  return { error: null, user };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: permissionError, user } = await checkAdminPermission();
    if (permissionError || !user) {
      return NextResponse.json(
        { error: permissionError || 'Authentication failed' },
        { status: 401 }
      );
    }

    const { id: unitId } = await params;
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const code = formData.get('code') as string;
    const category = formData.get('category') as string;
    const baseUnit = formData.get('baseUnit') as string | null;
    const conversionFactor = formData.get('conversionFactor') as string | null;

    // Validate inputs
    if (!name || !code || !category) {
      return NextResponse.json(
        { error: 'Name, code, and category are required.' },
        { status: 400 }
      );
    }

    const unit = await prisma.unitOfMeasurement.update({
      where: { id: unitId },
      data: {
        name,
        code: code.toUpperCase(),
        category,
        baseUnit: baseUnit || null,
        conversionFactor: conversionFactor ? parseFloat(conversionFactor) : null,
      },
    });

    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'UPDATE_UNIT',
      entityType: 'UNIT',
      entityId: unit.id,
      details: { name, code, category },
    });

    return NextResponse.json({
      message: 'Unit updated successfully',
      unit,
    });

  } catch (error: any) {
    console.error('Error updating unit:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A unit with this code already exists.' },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Unit not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update unit' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error: permissionError, user } = await checkAdminPermission();
    if (permissionError || !user) {
      return NextResponse.json(
        { error: permissionError || 'Authentication failed' },
        { status: 401 }
      );
    }

    const { id: unitId } = await params;

    // Check if unit exists
    const existingUnit = await prisma.unitOfMeasurement.findUnique({
      where: { id: unitId },
    });

    if (!existingUnit) {
      return NextResponse.json(
        { error: 'Unit not found.' },
        { status: 404 }
      );
    }

    await prisma.unitOfMeasurement.delete({
      where: { id: unitId },
    });

    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'DELETE_UNIT',
      entityType: 'UNIT',
      entityId: unitId,
      details: { name: existingUnit.name, code: existingUnit.code },
    });

    return NextResponse.json({
      message: 'Unit deleted successfully',
    });

  } catch (error: any) {
    console.error('Error deleting unit:', error);
    
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete unit as it is being used in other records.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete unit' },
      { status: 500 }
    );
  }
}