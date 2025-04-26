import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function StakingSkeleton() {
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
              </div>
              <Skeleton className="h-4 w-36 mt-1" />
            </div>

            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Stakes section skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-8 w-16" />
              </div>

              <div>
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>

            <div className="space-y-4 mt-6">
              {/* Stake item skeletons */}
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-12" />
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History section skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-2 border-b border-gray-800 last:border-0">
                  <div>
                    <Skeleton className="h-5 w-16 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
