import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/lib/activity-logger';

export async function GET() {
  try {
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
      select: { role: true }
    });

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get security settings (create default if none exist)
    let settings = await prisma.securitySettings.findFirst();
    
    if (!settings) {
      settings = await prisma.securitySettings.create({
        data: {
          sessionTimeoutMinutes: 30,
          maxLoginAttempts: 5,
          lockoutDurationMinutes: 15,
          passwordExpiryDays: 90
        }
      });
    }

    return NextResponse.json({ settings });

  } catch (error) {
    console.error('Error fetching security settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const { sessionTimeoutMinutes } = await request.json();

    // Validate input
    if (sessionTimeoutMinutes < 5 || sessionTimeoutMinutes > 480) {
      return NextResponse.json(
        { error: 'Session timeout must be between 5 and 480 minutes' },
        { status: 400 }
      );
    }

    // Get or create settings
    let settings = await prisma.securitySettings.findFirst();
    
    if (settings) {
      // Update existing settings
      settings = await prisma.securitySettings.update({
        where: { id: settings.id },
        data: {
          sessionTimeoutMinutes
        }
      });
    } else {
      // Create new settings
      settings = await prisma.securitySettings.create({
        data: {
          sessionTimeoutMinutes,
          maxLoginAttempts: 5,
          lockoutDurationMinutes: 15,
          passwordExpiryDays: 90
        }
      });
    }

    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'UPDATE_SECURITY_SETTINGS',
      entityType: 'SYSTEM',
      entityId: settings.id,
      details: {
        sessionTimeoutMinutes,
        updatedBy: profile.name
      }
    });

    return NextResponse.json({
      message: 'Security settings updated successfully',
      settings
    });

  } catch (error) {
    console.error('Error updating security settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}