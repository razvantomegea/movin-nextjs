import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function EnergyPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Daily Calories Card Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Skeleton className="h-9 w-9 rounded-full mr-3" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-baseline">
                <Skeleton className="h-10 w-24 mr-2" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-2 w-full mt-3" />

              <div className="grid grid-cols-4 gap-4 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex flex-col items-center">
                    <Skeleton className="h-8 w-8 rounded-full mb-2" />
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-4 w-8 mt-1" />
                  </div>
                ))}
              </div>
            </div>

            <div className="ml-6">
              <Skeleton className="h-24 w-24 rounded-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Energy Chart Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <Skeleton className="h-10 w-full sm:w-64" />
              <Skeleton className="h-10 w-full sm:w-48" />
            </div>

            <Skeleton className="h-64 w-full" />

            <div className="mt-4 flex flex-col items-center">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Meals Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Skeleton className="h-5 w-48 mb-1" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meal Detection Info Card Skeleton */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start">
            <Skeleton className="h-9 w-9 rounded-full mr-3 mt-1" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-3" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
