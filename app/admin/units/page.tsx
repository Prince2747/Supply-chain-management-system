import { UnitsManagement } from '@/components/admin/units-management'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Suspense } from 'react'

function UnitsManagementSkeleton() {
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
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminUnitsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Units of Measurement</h2>
        <p className="text-muted-foreground">
          Define and manage units of measurement for inventory tracking
        </p>
      </div>

      <Suspense fallback={<UnitsManagementSkeleton />}>
        <UnitsManagement />
      </Suspense>
    </div>
  )
}
