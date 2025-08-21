import { prisma } from "@/lib/prisma";
import { ActivityLogsClient } from "./activity-logs-client";

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: {
    email: string | null;
    name: string | null;
  };
}

async function getActivityLogs(): Promise<ActivityLog[]> {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100, // Limit to last 100 logs for performance
      include: {
        // We'll need to join with Profile table to get user info
        // For now, we'll fetch user info separately
      },
    });

    // Get user profiles for the logs
    const userIds = [...new Set(logs.map((log) => log.userId))];
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, email: true, name: true },
    });

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    return logs.map((log) => ({
      ...log,
      createdAt: log.createdAt,
      user: profileMap.get(log.userId) || null,
    }));
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    // Return empty array if database is not accessible
    return [];
  }
}

export async function ActivityLogs() {
  const logs = await getActivityLogs();

  return <ActivityLogsClient initialLogs={logs} />;
}
