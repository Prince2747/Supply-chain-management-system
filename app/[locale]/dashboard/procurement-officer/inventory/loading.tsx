import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function InventoryLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Crop Summary */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-18" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-2 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Details */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <Skeleton className="h-10 w-[200px]" />
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[180px]" />
          </div>

          {/* Inventory Items */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}