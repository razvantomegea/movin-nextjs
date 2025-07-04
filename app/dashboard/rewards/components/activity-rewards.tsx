'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { CircleDollarSign, RefreshCw } from 'lucide-react';

import { CelebrationAnimation } from '@/components/celebration-animation';
import { TransactionConfirmationModal } from '@/components/transaction-confirmation-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { LoadingButton } from '@/components/ui/loading-button';
import { Progress } from '@/components/ui/progress';
import { RewardCountdownTimer } from '@/components/ui/reward-countdown-timer';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchActivityRewards,
  recordActivityReward,
} from '@/lib/redux/slices/activityRewardsSlice';
import { createPost } from '@/lib/redux/slices/socialFeedSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { RootState } from '@/lib/redux/store';
import { mapActivitiesToDaily, mapError, type DailyActivity } from '@/utils';
import {
  generateAchievementPostContent,
  createAchievementData,
  AchievementTypeEnum,
} from '@/utils/achievements/shareAchievement';
import { calculateMetsFromCalories } from '@/utils/movin/calculateMets';
import { ActivityRewardsHistory } from './activity-rewards-history';
import { ActivityRewardsSkeleton } from './activity-rewards-skeleton';

interface ActivityRewardsProps {
  refreshing: boolean;
  onDataLoaded?: () => void;
}

export function ActivityRewards({ refreshing, onDataLoaded }: ActivityRewardsProps) {
  const dispatch = useAppDispatch();
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [rewardsToSave, setRewardsToSave] = useState(0);
  const [expirationTimestamp, setExpirationTimestamp] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { address } = useAppKitAccount();
  const addressLower = useMemo(() => address?.toLowerCase(), [address]);
  const currentDate = useMemo(() => new Date(), []);
  const { useUserActivity, useCalculateActivityRewards, useRecordActivity, usePremiumStatus } =
    useMovinEarn();
  const { isPremiumActive } = usePremiumStatus();
  const isPremium = isPremiumActive();

  const {
    formattedActivity,
    error: activityError,
    refetch: refetchUserActivity,
  } = useUserActivity();

  const {
    activities,
    error: activitiesError,
    isLoading: activitiesLoading,
  } = useAppSelector((state: RootState) => state.activityData);

  const { isLoading: rewardsLoading, error: rewardsDbError } = useAppSelector(
    (state) => state.activityRewards,
  );

  const blockchainActivity = formattedActivity();

  const dailyActivity: DailyActivity | null = useMemo(() => {
    if (activities.length > 0) {
      return mapActivitiesToDaily(activities, currentDate);
    }
    return null;
  }, [activities, currentDate]);

  const stepsToClaim = useMemo(() => {
    const dailySteps = dailyActivity?.steps || 0;

    if (!blockchainActivity) return dailySteps;

    if (blockchainActivity.dailySteps >= dailySteps) {
      return 0;
    }

    return Math.abs(dailySteps - blockchainActivity.dailySteps);
  }, [blockchainActivity, dailyActivity]);

  const metsToClaim = useMemo(() => {
    if (!isPremium) return 0;

    const dailyMets = calculateMetsFromCalories(dailyActivity?.calories || 0);

    if (!blockchainActivity) return dailyMets;

    if (blockchainActivity.dailyMets >= dailyMets) {
      return 0;
    }

    return Math.abs(dailyMets - blockchainActivity.dailyMets);
  }, [blockchainActivity, dailyActivity, isPremium]);

  const {
    formattedRewards,
    error: rewardsError,
    refetch: refetchRewards,
  } = useCalculateActivityRewards(stepsToClaim, metsToClaim);

  const rewards = formattedRewards();

  const {
    recordActivity,
    isSuccess: isClaimSuccess,
    error: claimError,
    isPending: isClaiming,
  } = useRecordActivity();

  const totalRewards = useMemo(() => {
    if (!rewards) return 0;
    return rewards.stepsRewards + rewards.metsRewards;
  }, [rewards]);

  const rewardBreakdown = useMemo(() => {
    if (!rewards) return [];

    const stepsPercentage = totalRewards > 0 ? (rewards.stepsRewards / totalRewards) * 100 : 0;
    const metsPercentage = totalRewards > 0 ? (rewards.metsRewards / totalRewards) * 100 : 0;

    return [
      { type: 'Steps', amount: rewards.stepsRewards, percentage: stepsPercentage },
      { type: 'METs', amount: rewards.metsRewards, percentage: metsPercentage },
    ];
  }, [rewards, totalRewards]);

  const rewardsToSaveString = useMemo(() => {
    return rewardsToSave.toFixed(2);
  }, [rewardsToSave]);

  const handleRefresh = useCallback(async () => {
    if (!addressLower) {
      return;
    }

    await Promise.all([
      refetchUserActivity(),
      refetchRewards(),
      dispatch(fetchActivityRewards(addressLower)),
    ]);

    if (onDataLoaded) {
      onDataLoaded();
    }
  }, [refetchUserActivity, refetchRewards, addressLower, dispatch, onDataLoaded]);

  useEffect(() => {
    if (refreshing) {
      handleRefresh();
    }
  }, [handleRefresh, refreshing]);

  // Calculate activity rewards expiration (midnight tomorrow)
  const updateActivityRewardExpiration = useCallback(() => {
    if (totalRewards <= 0) {
      setExpirationTimestamp(null);
      return;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    setExpirationTimestamp(Math.floor(tomorrow.getTime() / 1000));
  }, [totalRewards]);

  // Update expiration timestamp when rewards change
  useEffect(() => {
    updateActivityRewardExpiration();
  }, [totalRewards, updateActivityRewardExpiration]);

  // Update rewards in Supabase database
  const saveRewardsToDatabase = useCallback(async () => {
    if (rewardsToSave <= 0 || !addressLower || rewardsLoading) {
      return;
    }

    try {
      await dispatch(
        recordActivityReward({
          address: addressLower,
          rewards: rewardsToSave,
        }),
      ).unwrap();
    } catch (error) {
      console.error('Error recording activity reward:', error);
      dispatch(
        showErrorToast({
          title: 'Database Update Failed',
          description: 'Failed to record your rewards. Please try again.',
        }),
      );

      setRewardsToSave(0);
    }
  }, [dispatch, rewardsToSave, addressLower, rewardsLoading]);

  const handleTransactionSuccess = useCallback(async () => {
    if (isClaimSuccess && isConfirmModalOpen) {
      setIsConfirmModalOpen(false);
      await saveRewardsToDatabase();
      await handleRefresh();

      dispatch(
        showSuccessToast({
          title: 'Claim Successful',
          description: 'Your activity rewards have been claimed successfully.',
        }),
      );

      setShowCelebration(true);
    }
  }, [dispatch, saveRewardsToDatabase, isConfirmModalOpen, isClaimSuccess, handleRefresh]);

  const handleTransactionFail = useCallback(async () => {
    if (claimError && isConfirmModalOpen) {
      setIsConfirmModalOpen(false);
      await handleRefresh();

      dispatch(
        showErrorToast({
          title: 'Claim Failed',
          description: mapError(claimError),
        }),
      );
    }
  }, [dispatch, claimError, isConfirmModalOpen, handleRefresh]);

  useEffect(() => {
    if (claimError && isConfirmModalOpen) {
      handleTransactionFail();
    }
  }, [claimError, handleTransactionFail, isConfirmModalOpen]);

  useEffect(() => {
    if (isClaimSuccess && isConfirmModalOpen) {
      handleTransactionSuccess();
    }
  }, [isClaimSuccess, handleTransactionSuccess, isConfirmModalOpen]);

  const handleClaimActivityRewards = async () => {
    try {
      setIsConfirmModalOpen(true);
      setRewardsToSave(totalRewards);
      await recordActivity(stepsToClaim, metsToClaim);
    } catch (err) {
      setIsConfirmModalOpen(false);

      dispatch(
        showErrorToast({
          title: 'Transaction Failed',
          description: 'Failed to claim rewards. Please try again.',
        }),
      );

      console.error('Claim error:', err);
    }
  };

  const handleCloseConfirmModal = useCallback(() => {
    setIsConfirmModalOpen(false);
  }, []);

  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
    setRewardsToSave(0);
  }, []);

  // Achievement sharing handler
  const handleShareActivityRewards = useCallback(async () => {
    if (!addressLower || rewardsToSave <= 0) return;

    try {
      const achievementData = createAchievementData(
        AchievementTypeEnum.workout,
        `${rewardsToSave.toFixed(2)} MVN`,
        'Activity Rewards Claimed',
        'Congratulations on claiming your activity rewards!',
        rewardsToSave.toFixed(2),
        'MVN',
        AchievementTypeEnum.activityRewards,
      );

      const postContent = generateAchievementPostContent(achievementData);

      await dispatch(
        createPost({
          address: addressLower,
          postData: { content: postContent },
        }),
      ).unwrap();

      dispatch(
        showSuccessToast({
          title: 'Achievement Shared!',
          description: 'Your activity rewards achievement has been shared with your connections.',
        }),
      );

      setShowCelebration(false);
      setRewardsToSave(0);
    } catch (error) {
      console.error('Failed to share activity rewards achievement:', error);
      dispatch(
        showErrorToast({
          title: 'Share Failed',
          description: 'Unable to share achievement. Please try again.',
        }),
      );
    }
  }, [addressLower, rewardsToSave, dispatch]);

  const errorMessage = useMemo(() => {
    if (activityError) {
      return activityError.message;
    }
    if (rewardsError) {
      return rewardsError.message;
    }
    if (activitiesError) {
      return activitiesError;
    }
    if (rewardsDbError) {
      return rewardsDbError;
    }
    return null;
  }, [activityError, rewardsError, activitiesError, rewardsDbError]);

  const isLoadingData = useMemo(
    () => refreshing || activitiesLoading || rewardsLoading,
    [refreshing, activitiesLoading, rewardsLoading],
  );

  if (isLoadingData) {
    return <ActivityRewardsSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={errorMessage} />
        <Button onClick={handleRefresh} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Activity Rewards</h2>

          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center mb-2">
              <CircleDollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
              <span className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {totalRewards.toFixed(2)}
              </span>
              <span className="text-xl ml-2 text-gray-500 dark:text-gray-400">MVN</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total earned today</span>
            {totalRewards > 0 && expirationTimestamp && (
              <RewardCountdownTimer
                expirationTimestamp={expirationTimestamp}
                hasRewards={totalRewards > 0}
              />
            )}
          </div>

          <LoadingButton
            className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600"
            loading={isClaiming}
            loadingText="Preparing Transaction..."
            onClick={handleClaimActivityRewards}
            disabled={totalRewards <= 0 || isClaiming}
          >
            Claim Rewards
          </LoadingButton>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Reward Breakdown</h2>
        </div>

        <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="space-y-4">
              {rewardBreakdown.map((reward, index) => (
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

      {/* Activity Rewards History */}
      <ActivityRewardsHistory />

      {/* Transaction Confirmation Modal */}
      <TransactionConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onSuccess={handleTransactionSuccess}
        onFail={handleTransactionFail}
        rewardAmount={totalRewards}
        transactionDescription={`Please confirm the transaction in your wallet to claim ${totalRewards.toFixed(
          2,
        )} MVN from your activity`}
      />

      {/* Celebration Animation */}
      <CelebrationAnimation
        isOpen={showCelebration}
        onClose={handleCloseCelebration}
        achievementType="workout"
        achievementValue={`${rewardsToSaveString} MVN`}
        achievementTitle="Activity Rewards Claimed"
        description="Congratulations on claiming your activity rewards!"
        rewardAmount={rewardsToSaveString}
        rewardCurrency="MVN"
        showReward={true}
        onShare={handleShareActivityRewards}
        showShareButton={!!addressLower}
      />
    </div>
  );
}
