"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Flame, History, Users, TrendingUp, Lock, Plus, RefreshCw, Copy, Send } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useTheme } from "next-themes"
import { StakeModal } from "@/components/stake-modal"
import { CountdownTimer } from "@/components/countdown-timer"
import { LoadingButton } from "@/components/ui/loading-button"
import { ErrorAlert } from "@/components/ui/error-alert"
import ErrorBoundary from "@/components/error-boundary"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { fetchStakingData, claimStakingRewards, resetStakingError } from "@/lib/redux/slices/stakingSlice"
import { StakingSkeleton } from "@/components/skeletons/staking-skeleton"
import { ActivityRewardsSkeleton } from "@/components/skeletons/activity-rewards-skeleton"
import { ReferralRewardsSkeleton } from "@/components/skeletons/referral-rewards-skeleton"
import {
  fetchActivityRewards,
  claimActivityRewards,
  resetActivityRewardsError,
} from "@/lib/redux/slices/activityRewardsSlice"
import {
  fetchReferralRewards,
  claimReferralRewards,
  resetReferralRewardsError,
  inviteFriend,
} from "@/lib/redux/slices/referralRewardsSlice"
import { showSuccessToast, showErrorToast } from "@/lib/redux/slices/toastSlice"
import { Input } from "@/components/ui/input"

export function RewardsDashboard() {
  const [activeTab, setActiveTab] = useState("activity")
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")

  const dispatch = useAppDispatch()

  // Staking state
  const {
    stakes,
    totalStaked,
    totalRewards: stakingTotalRewards,
    availableMVN,
    history,
    isLoading: stakingLoading,
    isClaiming: stakingClaiming,
    error: stakingError,
  } = useAppSelector((state) => state.staking)

  // Activity rewards state
  const {
    totalRewards: activityTotalRewards,
    weeklyRewards,
    activityRewards,
    challenges,
    isLoading: activityLoading,
    isClaiming: activityClaiming,
    error: activityError,
  } = useAppSelector((state) => state.activityRewards)

  // Referral rewards state
  const {
    totalReferrals,
    totalRewards: referralTotalRewards,
    referralCode,
    referrals,
    isLoading: referralLoading,
    isClaiming: referralClaiming,
    isInviting,
    error: referralError,
  } = useAppSelector((state) => state.referralRewards)

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === "staking") {
      dispatch(fetchStakingData())
    } else if (activeTab === "activity") {
      dispatch(fetchActivityRewards())
    } else if (activeTab === "referrals") {
      dispatch(fetchReferralRewards())
    }
  }, [dispatch, activeTab])

  const handleClaimStakingRewards = async () => {
    try {
      await dispatch(claimStakingRewards()).unwrap()

      dispatch(
        showSuccessToast({
          title: "Rewards Claimed",
          description: `You have successfully claimed ${stakingTotalRewards.toFixed(2)} MVN in rewards.`,
        }),
      )
    } catch (err) {
      // Error is handled in the component via the stakingError state
      dispatch(
        showErrorToast({
          title: "Claim Failed",
          description: err instanceof Error ? err.message : "An unknown error occurred",
        }),
      )
    }
  }

  const handleClaimActivityRewards = async () => {
    try {
      await dispatch(claimActivityRewards()).unwrap()

      dispatch(
        showSuccessToast({
          title: "Activity Rewards Claimed",
          description: `You have successfully claimed ${activityTotalRewards.toFixed(2)} MVN in activity rewards.`,
        }),
      )
    } catch (err) {
      // Error is handled in the component via the activityError state
      dispatch(
        showErrorToast({
          title: "Claim Failed",
          description: err instanceof Error ? err.message : "An unknown error occurred",
        }),
      )
    }
  }

  const handleClaimReferralRewards = async () => {
    try {
      await dispatch(claimReferralRewards()).unwrap()

      dispatch(
        showSuccessToast({
          title: "Referral Rewards Claimed",
          description: `You have successfully claimed ${referralTotalRewards.toFixed(2)} MVN in referral rewards.`,
        }),
      )
    } catch (err) {
      // Error is handled in the component via the referralError state
      dispatch(
        showErrorToast({
          title: "Claim Failed",
          description: err instanceof Error ? err.message : "An unknown error occurred",
        }),
      )
    }
  }

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralCode).then(
      () => {
        dispatch(
          showSuccessToast({
            title: "Copied to Clipboard",
            description: "Referral code copied to clipboard",
          }),
        )
      },
      () => {
        dispatch(
          showErrorToast({
            title: "Copy Failed",
            description: "Failed to copy referral code",
          }),
        )
      },
    )
  }

  const handleInviteFriend = async () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      dispatch(
        showErrorToast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
        }),
      )
      return
    }

    try {
      await dispatch(inviteFriend(inviteEmail)).unwrap()

      dispatch(
        showSuccessToast({
          title: "Invitation Sent",
          description: `Invitation sent to ${inviteEmail}`,
        }),
      )

      // Clear the input
      setInviteEmail("")
    } catch (err) {
      dispatch(
        showErrorToast({
          title: "Invitation Failed",
          description: err instanceof Error ? err.message : "An unknown error occurred",
        }),
      )
    }
  }

  const handleRetryLoadStaking = () => {
    dispatch(resetStakingError())
    dispatch(fetchStakingData())
  }

  const handleRetryLoadActivity = () => {
    dispatch(resetActivityRewardsError())
    dispatch(fetchActivityRewards())
  }

  const handleRetryLoadReferrals = () => {
    dispatch(resetReferralRewardsError())
    dispatch(fetchReferralRewards())
  }

  // Render the activity rewards content safely
  const renderActivityContent = () => {
    if (activityLoading) {
      return <ActivityRewardsSkeleton />
    }

    if (activityError) {
      return (
        <div className="space-y-4">
          <ErrorAlert message={activityError} />
          <Button onClick={handleRetryLoadActivity} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Activity Rewards</h2>

            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center mb-2">
                <Flame className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {activityTotalRewards.toFixed(2)}
                </span>
                <span className="text-xl ml-2 text-gray-500 dark:text-gray-400">MVN</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Total earned this week</span>
            </div>

            <LoadingButton
              className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600"
              loading={activityClaiming}
              loadingText="Claiming..."
              onClick={handleClaimActivityRewards}
              disabled={activityTotalRewards <= 0}
            >
              Claim Rewards
            </LoadingButton>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Reward Breakdown</h2>
            <Button variant="ghost" size="sm" className="text-gray-400">
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          </div>

          <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="space-y-4">
                {activityRewards.map((reward, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{reward.type}</span>
                      <span className="font-medium">{reward.amount.toFixed(2)} MVN</span>
                    </div>
                    <Progress value={reward.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Upcoming Rewards</h2>
          <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="flex items-center p-2 bg-gray-200/70 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                      <Award className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{challenge.title}</span>
                        <span className="text-blue-400 font-medium">+{challenge.reward.toFixed(2)} MVN</span>
                      </div>
                      <div className="text-sm text-gray-400 mt-1">{challenge.description}</div>
                      <Progress value={(challenge.progress / challenge.total) * 100} className="h-1.5 mt-2" />
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

  // Render the staking content safely
  const renderStakingContent = () => {
    if (stakingLoading) {
      return <StakingSkeleton />
    }

    if (stakingError) {
      return (
        <div className="space-y-4">
          <ErrorAlert message={stakingError} />
          <Button onClick={handleRetryLoadStaking} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Staking Rewards</h2>

            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center mb-2">
                <Flame className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-4xl font-bold text-blue-400">{stakingTotalRewards.toFixed(2)}</span>
                <span className="text-xl ml-2 text-gray-400">MVN</span>
              </div>
              <span className="text-sm text-gray-400">Total staking rewards</span>
            </div>

            <LoadingButton
              className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600"
              loading={stakingClaiming}
              loadingText="Claiming..."
              onClick={handleClaimStakingRewards}
              disabled={stakingTotalRewards <= 0}
            >
              Claim Rewards
            </LoadingButton>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Your Stakes</h2>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-500 text-blue-500"
              onClick={() => setIsStakeModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Stake More
            </Button>
          </div>

          <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-sm text-gray-400">Total Staked</span>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold">{totalStaked}</span>
                    <span className="text-sm ml-1 text-gray-400">MVN</span>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-400">Available</span>
                  <div className="text-xl font-bold text-blue-500">{availableMVN} MVN</div>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                {stakes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="mb-2">You don't have any active stakes</p>
                    <Button variant="outline" className="mt-2" onClick={() => setIsStakeModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Stake Now
                    </Button>
                  </div>
                ) : (
                  stakes.map((stake) => (
                    <div
                      key={stake.id}
                      className={`p-4 rounded-lg ${isDark ? "bg-gray-800" : "bg-white"} border ${
                        isDark ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <Lock className="h-4 w-4 mr-2 text-blue-500" />
                          <span className="font-medium">{stake.amount} MVN</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1 text-green-500" />
                          <span className="text-green-500 font-medium">{stake.apr}% APR</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">Lock Period</span>
                        <span>
                          {stake.period} {stake.period === 1 ? "month" : "months"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">Rewards</span>
                        <span className="text-blue-500">+{stake.rewards.toFixed(2)} MVN</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                        <span className="text-sm text-gray-500">Unlocks in</span>
                        <CountdownTimer
                          endDate={stake.endDate}
                          className="text-sm"
                          onComplete={() => {
                            dispatch(
                              showSuccessToast({
                                title: "Stake Unlocked",
                                description: `Your stake of ${stake.amount} MVN is now available to withdraw.`,
                              }),
                            )
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Staking History</h2>
          <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="space-y-3">
                {history.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border-b border-gray-800 last:border-0">
                    <div>
                      <div className="font-medium">{item.type}</div>
                      <div className="text-xs text-gray-400">{item.date}</div>
                    </div>
                    <div className={`font-medium ${item.type === "Reward" ? "text-green-500" : "text-blue-400"}`}>
                      {item.amount}
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

  // Render the referral rewards content safely
  const renderReferralContent = () => {
    if (referralLoading) {
      return <ReferralRewardsSkeleton />
    }

    if (referralError) {
      return (
        <div className="space-y-4">
          <ErrorAlert message={referralError} />
          <Button onClick={handleRetryLoadReferrals} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Referral Rewards</h2>

            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center mb-2">
                <Users className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-4xl font-bold text-blue-400">{totalReferrals}</span>
              </div>
              <span className="text-sm text-gray-400">Total referrals</span>

              <div className="flex items-center mt-4">
                <span className="text-2xl font-bold text-blue-400">{referralTotalRewards.toFixed(1)}</span>
                <span className="text-sm ml-1 text-gray-400">MVN earned</span>
              </div>
            </div>

            <LoadingButton
              className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600"
              loading={referralClaiming}
              loadingText="Claiming..."
              onClick={handleClaimReferralRewards}
              disabled={referralTotalRewards <= 0}
            >
              Claim Rewards
            </LoadingButton>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Your Referral Code</h2>
          <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="font-mono text-lg font-medium bg-gray-800 p-2 rounded flex-1 text-center">
                  {referralCode}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-3 border-blue-500 text-blue-400 hover:bg-blue-500/10"
                  onClick={handleCopyReferralCode}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
              </div>

              <div className="mt-4 text-sm text-gray-400 text-center">
                Earn 1.5 MVN for each friend who joins and completes their first activity
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Invite Friends</h2>
          <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <LoadingButton
                  variant="outline"
                  className="border-blue-500 text-blue-500"
                  loading={isInviting}
                  loadingText="Sending..."
                  onClick={handleInviteFriend}
                >
                  <Send className="h-4 w-4 mr-1" />
                  Invite
                </LoadingButton>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Referral Activity</h2>
          <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
            <CardContent className="p-4">
              <div className="space-y-3">
                {referrals.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border-b border-gray-800 last:border-0">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                        <span className="text-blue-400 font-medium">{item.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-400">{item.date}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-green-500 text-right font-medium">+{item.reward.toFixed(1)} MVN</div>
                      <div className="text-xs text-gray-400">{item.status}</div>
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

  return (
    <DashboardLayout>
      <div className="p-4">
        <Tabs defaultValue="activity" onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Rewards</h1>
            <TabsList className="grid grid-cols-3 h-10 p-0.5">
              <TabsTrigger value="activity" className="px-4">
                Activity
              </TabsTrigger>
              <TabsTrigger value="staking" className="px-4">
                Staking
              </TabsTrigger>
              <TabsTrigger value="referrals" className="px-4">
                Referrals
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="activity" className="mt-0">
            <ErrorBoundary>{renderActivityContent()}</ErrorBoundary>
          </TabsContent>

          <TabsContent value="staking" className="mt-0">
            <ErrorBoundary>{renderStakingContent()}</ErrorBoundary>
          </TabsContent>

          <TabsContent value="referrals" className="mt-0">
            <ErrorBoundary>{renderReferralContent()}</ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stake Modal */}
      <StakeModal isOpen={isStakeModalOpen} onClose={() => setIsStakeModalOpen(false)} />
    </DashboardLayout>
  )
}
