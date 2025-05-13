import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WorkoutsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Recent Workouts Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Skeleton className="h-9 w-9 rounded-full mr-3" />
              <Skeleton className="h-5 w-36" />
            </div>
          </div>

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

      {/* Weekly Activity Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full mr-3" />
                <Skeleton className="h-5 w-36" />
              </div>
              <Skeleton className="h-5 w-24" />
            </div>

            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
