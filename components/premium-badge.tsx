"use client"

import { useEffect } from "react"
import { Crown } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchSubscriptionStatus } from "@/lib/redux/slices/subscriptionSlice"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function PremiumBadge() {
  const dispatch = useAppDispatch()
  const { isPremium, isLoading } = useAppSelector((state) => state.subscription)

  useEffect(() => {
    dispatch(fetchSubscriptionStatus())
  }, [dispatch])

  if (isLoading) {
    return <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
  }

  if (!isPremium) {
    return null
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-center h-5 w-5">
            <Crown className="h-5 w-5 text-yellow-400" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Premium Member</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
