import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export function ReferralRewardsSkeleton() {
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
                <Skeleton className="h-10 w-10" />
              </div>
              <Skeleton className="h-4 w-36 mt-1" />

              <div className="flex items-center mt-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24 ml-2" />
              </div>
            </div>

            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Referral Code section skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-36" />

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-full mr-3" />
              <Skeleton className="h-10 w-20 flex-shrink-0" />
            </div>

            <Skeleton className="h-4 w-full mt-4" />
          </CardContent>
        </Card>
      </div>

      {/* Referral Activity section skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />

        <Card>
          <CardContent className="p-4">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-2 border-b last:border-0">
                  <div className="flex items-center">
                    <Skeleton className="h-8 w-8 rounded-full mr-3" />
                    <div>
                      <Skeleton className="h-5 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div>
                    <Skeleton className="h-5 w-16 mb-1" />
                    <Skeleton className="h-3 w-12" />
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
