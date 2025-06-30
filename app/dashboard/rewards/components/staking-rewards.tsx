'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { CircleDollarSign, Lock, Plus, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { CelebrationAnimation } from '@/components/celebration-animation';
import { TransactionConfirmationModal } from '@/components/transaction-confirmation-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { LoadingButton } from '@/components/ui/loading-button';
import { RewardCountdownTimer } from '@/components/ui/reward-countdown-timer';
import { IUserStake, useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { useMovinToken } from '@/lib/hooks/useMovinToken';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchStakingData,
  updateStakeData,
  insertStakesData,
} from '@/lib/redux/slices/stakingSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { createPost } from '@/lib/redux/slices/socialFeedSlice';
import { IStake } from '@/lib/supabase/stake';
import {
  generateAchievementPostContent,
  createAchievementData,
} from '@/utils/achievements/shareAchievement';
import { matchUserStakeWithDB } from '@/utils/staking/matchUserStakeWithDB';
import { prepareUpdateStakesInDB } from '@/utils/staking/prepareUpdateStakesToDB';
import { StakeItem } from './stake-item';
import { StakeModal } from './stake-modal';
import { StakingHistory } from './staking-history';
import { StakingSkeleton } from './staking-skeleton';

interface StakingRewardsProps {
  refreshing: boolean;
  onDataLoaded?: () => void;
}

export function StakingRewards({ refreshing, onDataLoaded }: StakingRewardsProps) {
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<{ type: string; index: number } | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [claimAmount, setClaimAmount] = useState(0);
  const [expirationTimestamp, setExpirationTimestamp] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = useMemo(() => address?.toLowerCase(), [address]);

  const { useUserStakes, useClaimAllStakingRewards, useUnstake } = useMovinEarn();
  const {
    data: stakingData,
    isLoading: isLoadingStakingData,
    refetch: refetchStakingData,
  } = useUserStakes();

  const {
    history: stakingHistory,
    isLoading: isLoadingStakingHistory,
    error: stakingError,
  } = useAppSelector((state) => state.staking);

  const { useTokenBalance, useTokenSymbol } = useMovinToken();
  const { data: tokenSymbol } = useTokenSymbol();
  const { formattedBalanceWithSuffix: availableBalance, refetch: refetchTokenBalance } =
    useTokenBalance();

  const {
    claimAllStakingRewards,
    isSuccess: isClaimSuccess,
    error: claimError,
  } = useClaimAllStakingRewards();

  const { unstake, isSuccess: isUnstakeSuccess, error: unstakeError } = useUnstake();

  const formattedTotalRewards = useMemo(() => {
    if (!stakingData) return '0.00';
    return parseFloat(stakingData.totalStakingRewards).toFixed(2);
  }, [stakingData]);

  const totalRewardsValue = useMemo(() => {
    if (!stakingData) return 0;
    return parseFloat(stakingData.totalStakingRewards);
  }, [stakingData]);

  const hasNoRewards = useMemo(() => {
    return totalRewardsValue <= 0;
  }, [totalRewardsValue]);

  const buttonDisabled = useMemo(() => {
    return hasNoRewards || activeAction !== null || isLoadingStakingData;
  }, [hasNoRewards, activeAction, isLoadingStakingData]);

  const displayTokenSymbol = useMemo(() => {
    return tokenSymbol || 'MVN';
  }, [tokenSymbol]);

  const hasStakes = useMemo(() => {
    return stakingData?.stakes?.length > 0;
  }, [stakingData]);

  const totalClaimedRewards = useMemo(() => {
    return claimAmount.toFixed(2);
  }, [claimAmount]);

  const handleRefresh = useCallback(async () => {
    if (!addressLower) {
      return;
    }

    await Promise.all([
      refetchStakingData(),
      refetchTokenBalance(),
      dispatch(fetchStakingData(addressLower)),
    ]);

    if (onDataLoaded) {
      onDataLoaded();
    }
  }, [refetchStakingData, refetchTokenBalance, dispatch, addressLower, onDataLoaded]);

  const addStakesToDb = useCallback(async () => {
    if (!addressLower || !stakingData?.stakes) return;

    const { stakesToCreate, stakesToUpdate } = prepareUpdateStakesInDB({
      dbStakes: stakingHistory,
      userStakes: stakingData.stakes,
      address: addressLower,
    });

    if (stakesToCreate.length) {
      await dispatch(insertStakesData(stakesToCreate)).unwrap();
    }

    for (const stake of stakesToUpdate) {
      await dispatch(updateStakeData(stake)).unwrap();
    }
  }, [addressLower, stakingHistory, stakingData, dispatch]);

  const updateStakesInDatabase = useCallback(async () => {
    if (!addressLower || !activeAction || !stakingData?.stakes.length) {
      return;
    }

    try {
      const dbStakes = stakingHistory || [];

      if (activeAction.type === 'claim') {
        await addStakesToDb();
      } else if (activeAction?.type === 'unstake' && activeAction?.index !== undefined) {
        const blockchainStake = stakingData?.stakes[activeAction.index];

        if (blockchainStake) {
          const dbStake = dbStakes.find((s: IStake) => matchUserStakeWithDB(blockchainStake, s));

          if (dbStake) {
            await dispatch(
              updateStakeData({
                id: dbStake.id,
                is_active: false,
                unstake_time: new Date().toISOString(),
              }),
            ).unwrap();
          }
        }
      }
    } catch (error) {
      console.error(`Error updating stake in database (${activeAction.type}):`, error);
      dispatch(
        showErrorToast({
          title: 'Database Update Failed',
          description: 'Failed to update stake in database. Please refresh.',
        }),
      );
    } finally {
      setActiveAction(null);
      await handleRefresh();
    }
  }, [
    stakingHistory,
    stakingData,
    addressLower,
    activeAction,
    addStakesToDb,
    handleRefresh,
    dispatch,
  ]);

  // Calculate earliest expiration timestamp for staking rewards
  const updateOldestStakeExpirationTimestamp = useCallback(() => {
    if (!stakingData?.stakes || stakingData.stakes.length === 0) {
      setExpirationTimestamp(null);
      return;
    }

    const nowSeconds = new Date().getTime() / 1000;
    let soonestExpiration: number | null = null;

    for (const stake of stakingData.stakes) {
      const hasRewards = stake.reward && parseFloat(stake.reward) > 0;
      if (!hasRewards) {
        continue; // Skip stakes with no rewards
      }

      let stakeExpirationTimestamp: number | null = null;
      const lastClaimedBigInt = stake.lastClaimed;

      if (!lastClaimedBigInt || lastClaimedBigInt === BigInt(0)) {
        // Rewards never claimed, expire 24h after stake start time
        const startTimeNum = Number(stake.startTime);
        stakeExpirationTimestamp = startTimeNum + 24 * 60 * 60;
      } else {
        // Rewards claimed, expire 24h after last claim time
        const lastClaimedNum = Number(lastClaimedBigInt);
        stakeExpirationTimestamp = lastClaimedNum + 24 * 60 * 60;
      }

      // Only consider timestamps that are in the future
      if (stakeExpirationTimestamp !== null && stakeExpirationTimestamp > nowSeconds) {
        if (soonestExpiration === null || stakeExpirationTimestamp < soonestExpiration) {
          soonestExpiration = stakeExpirationTimestamp;
        }
      }
    }

    setExpirationTimestamp(soonestExpiration);
  }, [stakingData]);

  useEffect(() => {
    if (addressLower) {
      dispatch(fetchStakingData(addressLower));
    }
  }, [dispatch, addressLower]);

  useEffect(() => {
    if (refreshing) {
      handleRefresh();
    }
  }, [refreshing, handleRefresh, onDataLoaded]);

  useEffect(() => {
    if (stakingData?.stakes) {
      updateOldestStakeExpirationTimestamp();
    }
  }, [stakingData, updateOldestStakeExpirationTimestamp]);

  useEffect(() => {
    if (isClaimSuccess && activeAction?.type === 'claim' && isConfirmModalOpen) {
      setIsConfirmModalOpen(false);

      dispatch(
        showSuccessToast({
          title: 'Claim Successful',
          description: 'Your staking rewards have been claimed successfully.',
        }),
      );

      setShowCelebration(true);
      updateStakesInDatabase();
    }
  }, [isClaimSuccess, isConfirmModalOpen, activeAction, dispatch, updateStakesInDatabase]);

  useEffect(() => {
    if (isUnstakeSuccess && activeAction?.type === 'unstake' && isConfirmModalOpen) {
      setIsConfirmModalOpen(false);

      dispatch(
        showSuccessToast({
          title: 'Unstake Successful',
          description: 'Your tokens have been successfully unstaked.',
        }),
      );

      updateStakesInDatabase();
    }
  }, [isUnstakeSuccess, isConfirmModalOpen, dispatch, updateStakesInDatabase, activeAction]);

  useEffect(() => {
    if (claimError && isConfirmModalOpen && activeAction?.type === 'claim') {
      setIsConfirmModalOpen(false);

      dispatch(
        showErrorToast({
          title: 'Claim Failed',
          description: 'Failed to claim rewards. Please try again.',
        }),
      );

      setActiveAction(null);
    }
  }, [claimError, isConfirmModalOpen, dispatch, activeAction]);

  useEffect(() => {
    if (unstakeError && isConfirmModalOpen && activeAction?.type === 'unstake') {
      setIsConfirmModalOpen(false);

      dispatch(
        showErrorToast({
          title: 'Unstake Failed',
          description: 'Failed to unstake tokens. Please try again.',
        }),
      );

      setActiveAction(null);
    }
  }, [unstakeError, isConfirmModalOpen, dispatch, activeAction]);

  const handleClaimStakingRewards = async () => {
    try {
      setActiveAction({ type: 'claim', index: -1 });
      setClaimAmount(totalRewardsValue);
      setIsConfirmModalOpen(true);
      await claimAllStakingRewards();
    } catch (err) {
      setIsConfirmModalOpen(false);

      dispatch(
        showErrorToast({
          title: 'Transaction Failed',
          description: 'Failed to claim rewards. Please try again.',
        }),
      );

      console.error('Claim error:', err);
      setActiveAction(null);
    }
  };

  const handleUnstake = useCallback(
    async (stakeIndex: number) => {
      try {
        setActiveAction({ type: 'unstake', index: stakeIndex });
        setIsConfirmModalOpen(true);
        await unstake(stakeIndex);
      } catch (err) {
        setIsConfirmModalOpen(false);

        dispatch(
          showErrorToast({
            title: 'Transaction Failed',
            description: 'Failed to unstake tokens. Please try again.',
          }),
        );

        console.error('Unstake error:', err);
        setActiveAction(null);
      }
    },
    [dispatch, unstake, setActiveAction],
  );

  const handleOpenStakeModal = useCallback(() => {
    setActiveAction({ type: 'stake', index: -1 });
    setIsStakeModalOpen(true);
  }, [setActiveAction, setIsStakeModalOpen]);

  const handleCloseStakeModal = useCallback(
    async (isStaked?: boolean) => {
      if (isStaked) {
        await addStakesToDb();
      }

      await handleRefresh();
      setIsStakeModalOpen(false);
      setActiveAction(null);
    },
    [setActiveAction, setIsStakeModalOpen, addStakesToDb, handleRefresh],
  );

  const handleStakeUnlocked = useCallback(
    (amount: string) => {
      dispatch(
        showSuccessToast({
          title: 'Stake Unlocked',
          description: `Your stake of ${amount} ${
            tokenSymbol || 'MVN'
          } is now available to withdraw.`,
        }),
      );
    },
    [dispatch, tokenSymbol],
  );

  const handleTransactionSuccess = useCallback(async () => {
    setIsConfirmModalOpen(false);
    setActiveAction(null);
    await handleRefresh();
  }, [handleRefresh, setActiveAction]);

  const handleTransactionFail = useCallback(async () => {
    setIsConfirmModalOpen(false);
    setActiveAction(null);
    setClaimAmount(0);
    await handleRefresh();
  }, [handleRefresh, setActiveAction, setClaimAmount]);

  const handleCloseConfirmModal = useCallback(() => {
    setIsConfirmModalOpen(false);
  }, []);

  const handleCloseCelebration = useCallback(() => {
    setShowCelebration(false);
    setClaimAmount(0);
  }, []);

  // Achievement sharing handler
  const handleShareStakingRewards = useCallback(async () => {
    if (!addressLower || claimAmount <= 0) return;

    try {
      const achievementData = createAchievementData(
        'workout',
        `${claimAmount.toFixed(2)} ${displayTokenSymbol}`,
        'Staking Rewards Claimed',
        'Congratulations on claiming your staking rewards!',
        claimAmount.toFixed(2),
        displayTokenSymbol,
        'staking_rewards',
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
          description: 'Your staking rewards achievement has been shared with your connections.',
        }),
      );

      setShowCelebration(false);
      setClaimAmount(0);
    } catch (error) {
      console.error('Failed to share staking rewards achievement:', error);
      dispatch(
        showErrorToast({
          title: 'Share Failed',
          description: 'Unable to share achievement. Please try again.',
        }),
      );
    }
  }, [addressLower, claimAmount, displayTokenSymbol, dispatch]);

  const isLoadingData = useMemo(() => {
    return refreshing || isLoadingStakingData || isLoadingStakingHistory;
  }, [refreshing, isLoadingStakingData, isLoadingStakingHistory]);

  if (isLoadingData) {
    return <StakingSkeleton />;
  }

  if (stakingError) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={stakingError} />
        <Button onClick={handleRefresh} className="w-full">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border-gray-300 dark:border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-center mb-6">Staking Rewards</h2>

            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center mb-2">
                <CircleDollarSign className="h-6 w-6 text-blue-400 mr-2" />
                <span className="text-4xl font-bold text-blue-400">{formattedTotalRewards}</span>
                <span className="text-xl ml-2 text-gray-400">{displayTokenSymbol}</span>
              </div>
              <span className="text-sm text-gray-400">Total staking rewards</span>
              {!hasNoRewards && expirationTimestamp && (
                <RewardCountdownTimer
                  expirationTimestamp={expirationTimestamp}
                  hasRewards={!hasNoRewards}
                />
              )}
            </div>

            <LoadingButton
              className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600"
              loading={activeAction?.type === 'claim' || isLoadingData}
              loadingText="Preparing Transaction..."
              onClick={handleClaimStakingRewards}
              disabled={buttonDisabled}
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
              onClick={handleOpenStakeModal}
              disabled={activeAction !== null || isLoadingData}
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
                    <span className="text-2xl font-bold">{stakingData.totalStaked}</span>
                    <span className="text-sm ml-1 text-gray-400">{tokenSymbol}</span>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-400">Available</span>
                  <div className="text-xl font-bold text-blue-500">{availableBalance}</div>
                </div>
              </div>

              <div className="space-y-4 mt-6">
                {isLoadingData ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-t-2 border-blue-500 rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading stakes...</p>
                  </div>
                ) : !hasStakes ? (
                  <div className="text-center py-8 text-gray-500">
                    <Lock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="mb-2">You don&apos;t have any active stakes</p>
                    <Button variant="outline" className="mt-2" onClick={handleOpenStakeModal}>
                      <Plus className="h-4 w-4 mr-2" />
                      Stake Now
                    </Button>
                  </div>
                ) : (
                  stakingData.stakes.map((stake: IUserStake, index: number) => {
                    // Find the matching DB stake for rewards earned
                    const dbStake = stakingHistory?.find((s) => matchUserStakeWithDB(stake, s));
                    return (
                      <StakeItem
                        key={index}
                        stake={stake}
                        index={index}
                        isDark={isDark}
                        tokenSymbol={displayTokenSymbol}
                        activeAction={activeAction}
                        onUnstake={handleUnstake}
                        onStakeUnlocked={handleStakeUnlocked}
                        rewardsEarned={dbStake?.rewards}
                      />
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Use the StakingHistory component */}
        <StakingHistory />
      </div>

      {/* Stake Modal */}
      <StakeModal isOpen={isStakeModalOpen} onClose={handleCloseStakeModal} />

      {/* Transaction Confirmation Modal */}
      <TransactionConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onSuccess={handleTransactionSuccess}
        onFail={handleTransactionFail}
        rewardAmount={claimAmount}
      />

      {/* Celebration Animation */}
      <CelebrationAnimation
        isOpen={showCelebration}
        onClose={handleCloseCelebration}
        achievementType="streak"
        achievementValue={`${totalClaimedRewards} ${displayTokenSymbol}`}
        achievementTitle="Staking Rewards Claimed"
        description="Congratulations on claiming your staking rewards!"
        rewardAmount={totalClaimedRewards}
        rewardCurrency={displayTokenSymbol}
        showReward={true}
        onShare={handleShareStakingRewards}
        showShareButton={!!addressLower}
      />
    </>
  );
}
