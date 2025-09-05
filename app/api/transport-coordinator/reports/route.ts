import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error("Unauthorized");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });

  if (!profile || profile.role !== "transport_coordinator") {
    throw new Error("Access denied: Transport coordinator role required");
  }

  return profile;
}

export async function GET(request: NextRequest) {
  try {
    const profile = await getCurrentUser();
    
    const { searchParams } = new URL(request.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Default to last 30 days if no date range provided
    const now = new Date();
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const from = fromParam ? new Date(fromParam) : defaultFrom;
    const to = toParam ? new Date(toParam) : now;

    // Validate date range
    if (from > to) {
      return NextResponse.json(
        { error: "From date cannot be after to date" },
        { status: 400 }
      );
    }

    // Get transport tasks for the date range
    const tasks = await prisma.transportTask.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to
        }
      },
      include: {
        vehicle: true,
        driver: true,
        cropBatch: {
          include: {
            farm: true
          }
        },
        issues: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Get issues for the date range
    const issues = await prisma.transportIssue.findMany({
      where: {
        reportedAt: {
          gte: from,
          lte: to
        }
      },
      include: {
        transportTask: {
          include: {
            vehicle: true,
            driver: true,
            cropBatch: true
          }
        }
      }
    });

    // Calculate performance metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === "DELIVERED").length;
    const delayedTasks = tasks.filter(task => task.status === "DELAYED").length;
    const cancelledTasks = tasks.filter(task => task.status === "CANCELLED").length;
    const onTimeTasks = completedTasks - delayedTasks;

    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const onTimeRate = completedTasks > 0 ? (onTimeTasks / completedTasks) * 100 : 0;
    const issueRate = totalTasks > 0 ? (issues.length / totalTasks) * 100 : 0;

    // Vehicle utilization
    const vehicleStats = await prisma.vehicle.findMany({
      include: {
        transportTasks: {
          where: {
            createdAt: {
              gte: from,
              lte: to
            }
          }
        }
      }
    });

    const vehicleUtilization = vehicleStats.map(vehicle => ({
      id: vehicle.id,
      plateNumber: vehicle.plateNumber,
      type: vehicle.type,
      tasksCount: vehicle.transportTasks.length,
      utilizationRate: vehicle.transportTasks.length > 0 ? 
        (vehicle.transportTasks.filter(task => task.status === "DELIVERED").length / vehicle.transportTasks.length) * 100 : 0
    }));

    // Driver performance
    const driverStats = await prisma.driver.findMany({
      include: {
        transportTasks: {
          where: {
            createdAt: {
              gte: from,
              lte: to
            }
          },
          include: {
            issues: true
          }
        }
      }
    });

    const driverPerformance = driverStats.map(driver => ({
      id: driver.id,
      name: driver.name,
      tasksCount: driver.transportTasks.length,
      completedTasks: driver.transportTasks.filter(task => task.status === "DELIVERED").length,
      issuesCount: driver.transportTasks.reduce((sum, task) => sum + task.issues.length, 0),
      onTimeRate: driver.transportTasks.length > 0 ? 
        (driver.transportTasks.filter(task => task.status === "DELIVERED" && !task.issues.some(issue => issue.issueType === "TRAFFIC_DELAY" || issue.issueType === "WEATHER_DELAY")).length / driver.transportTasks.filter(task => task.status === "DELIVERED").length) * 100 : 0
    }));

    // Daily performance trends (for the date range, max 30 days)
    const daysDiff = Math.min(Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)), 30);
    const dailyTrends = [];
    
    for (let i = daysDiff - 1; i >= 0; i--) {
      const date = new Date(to.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayTasks = tasks.filter(task => 
        task.createdAt >= dayStart && task.createdAt <= dayEnd
      );
      const dayIssues = issues.filter(issue => 
        issue.reportedAt >= dayStart && issue.reportedAt <= dayEnd
      );

      dailyTrends.push({
        date: dayStart.toISOString().split('T')[0],
        tasks: dayTasks.length,
        completed: dayTasks.filter(task => task.status === "DELIVERED").length,
        issues: dayIssues.length
      });
    }

    // Issue breakdown
    const issueBreakdown = issues.reduce((acc, issue) => {
      acc[issue.issueType] = (acc[issue.issueType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const reports = {
      overview: {
        totalTasks,
        completedTasks,
        delayedTasks,
        cancelledTasks,
        completionRate: Math.round(completionRate),
        onTimeRate: Math.round(onTimeRate),
        issueRate: Math.round(issueRate),
        totalIssues: issues.length
      },
      vehicleUtilization,
      driverPerformance,
      dailyTrends,
      issueBreakdown,
      recentTasks: tasks.slice(0, 10),
      recentIssues: issues.slice(0, 10)
    };

    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error fetching transport reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch transport reports" },
      { status: 500 }
    );
  }
}
