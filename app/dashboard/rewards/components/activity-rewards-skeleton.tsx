import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function ActivityRewardsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Main rewards card skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-48 mb-6" />

            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center mb-2">
                <Skeleton className="h-6 w-6 mr-2 rounded-full" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-6 w-12 ml-2" />
              </div>
              <Skeleton className="h-4 w-36 mt-1" />
            </div>

            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Reward Breakdown section skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Rewards section skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center p-2 rounded-lg">
                  <Skeleton className="h-10 w-10 rounded-full mr-3" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-32 mb-1" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
