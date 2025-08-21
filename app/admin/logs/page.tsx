import { AdminAuthWrapper } from '@/components/admin/admin-auth-wrapper'
import { AdminLayout } from '@/components/admin/admin-layout'
import { ActivityLogs } from '@/components/admin/activity-logs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'

function ActivityLogsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminLogsPage() {
  return (
    <AdminAuthWrapper>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Activity Logs</h2>
            <p className="text-muted-foreground">
              Monitor system activity and user actions for security and auditing
            </p>
          </div>

          <Suspense fallback={<ActivityLogsSkeleton />}>
            <ActivityLogs />
          </Suspense>
        </div>
      </AdminLayout>
    </AdminAuthWrapper>
  )
}
