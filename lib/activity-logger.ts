import { prisma } from './prisma'
import { headers } from 'next/headers'

interface LogActivityParams {
  userId: string
  action: string
  entityType?: string
  entityId?: string
  details?: any
}

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  details
}: LogActivityParams) {
  try {
    // Get request headers for IP and user agent
    const headersList = await headers()
    const ipAddress = headersList.get('x-forwarded-for') || 
                     headersList.get('x-real-ip') || 
                     headersList.get('cf-connecting-ip') || 
                     'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entityType: entityType || null,
        entityId: entityId || null,
        details: details || null,
        ipAddress: ipAddress.split(',')[0].trim(), // Take first IP if multiple
        userAgent,
      },
    })
  } catch (error) {
    // Log to console but don't throw - activity logging shouldn't break the main flow
    console.error('Failed to log activity:', error)
  }
}

// Helper function to log user authentication events
export async function logAuthActivity(userId: string, action: 'LOGIN' | 'LOGOUT') {
  await logActivity({
    userId,
    action,
    entityType: 'USER',
    entityId: userId,
  })
}
