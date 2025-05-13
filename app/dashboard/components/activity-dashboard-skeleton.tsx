import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function ActivityDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Daily Activity Card Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Skeleton className="h-9 w-9 rounded-full mr-3" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-5 w-32" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-baseline">
                <Skeleton className="h-10 w-24 mr-2" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-2 w-full mt-3" />

              <div className="grid grid-cols-3 gap-4 mt-6">
                {[1, 2, 3].map((i) => (
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

      {/* Activity Chart Skeleton */}
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

      {/* Today's Workouts Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center p-3 rounded-lg">
                  <Skeleton className="h-9 w-9 rounded-full mr-3" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <div className="flex">
                      <Skeleton className="h-4 w-16 mr-3" />
                      <Skeleton className="h-4 w-16 mr-3" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
