'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAccount } from 'wagmi';

import ErrorBoundary from '@/components/error-boundary';
import { TransactionConfirmationModal } from '@/components/transaction-confirmation-modal';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch } from '@/lib/redux/hooks';
import {
  fetchActivityRewards,
  claimActivityRewards,
} from '@/lib/redux/slices/activityRewardsSlice';
import {
  fetchReferralRewards,
  claimReferralRewards,
} from '@/lib/redux/slices/referralRewardsSlice';
import { fetchStakingData, claimStakingRewards } from '@/lib/redux/slices/stakingSlice';
import { showSuccessToast, showErrorToast, showInfoToast } from '@/lib/redux/slices/toastSlice';

import { ActivityRewards } from './activity-rewards';
import { ReferralRewards } from './referral-rewards';
import { StakingRewards } from './staking-rewards';

export function RewardsDashboard() {
  const [activeTab, setActiveTab] = useState('activity');
  const [refreshing, setRefreshing] = useState(false);

  // Transaction confirmation modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [pendingTransactionType, setPendingTransactionType] = useState<
    'staking' | 'activity' | 'referral' | null
  >(null);
  const [pendingRewardAmount, setPendingRewardAmount] = useState(0);

  const dispatch = useAppDispatch();

  // Get user address from wagmi
  const { address, isConnected } = useAccount();
  const userAddress = useMemo(() => address || '', [address]);

  // Initial data loading
  useEffect(() => {
    if (userAddress) {
      // Load all rewards data when component mounts
      dispatch(fetchStakingData(userAddress));
      dispatch(fetchActivityRewards());
      dispatch(fetchReferralRewards());
    }
  }, [dispatch, userAddress]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'staking' && userAddress) {
        await dispatch(fetchStakingData(userAddress)).unwrap();
      } else if (activeTab === 'activity') {
        await dispatch(fetchActivityRewards()).unwrap();
      } else if (activeTab === 'referrals') {
        await dispatch(fetchReferralRewards()).unwrap();
      }

      dispatch(
        showSuccessToast({
          title: 'Data Refreshed',
          description: 'Your rewards data has been updated',
        }),
      );
    } catch (error) {
      dispatch(
        showInfoToast({
          title: 'Refresh Failed',
          description: 'Please try again later',
        }),
      );
    } finally {
      setRefreshing(false);
    }
  };

  // Handle initiating claim process - shows the transaction modal
  const initiateClaimProcess = (type: 'staking' | 'activity' | 'referral', amount: number) => {
    setPendingTransactionType(type);
    setPendingRewardAmount(amount);
    setIsTransactionModalOpen(true);
  };

  // Handle successful transaction confirmation
  const handleTransactionSuccess = async () => {
    try {
      if (pendingTransactionType === 'staking' && userAddress) {
        await dispatch(claimStakingRewards({ address: userAddress })).unwrap();
      } else if (pendingTransactionType === 'activity') {
        await dispatch(claimActivityRewards()).unwrap();
      } else if (pendingTransactionType === 'referral') {
        await dispatch(claimReferralRewards()).unwrap();
      }

      // Refresh data after successful claim
      handleRefresh();
    } catch (err) {
      dispatch(
        showErrorToast({
          title: 'Claim Failed',
          description: err instanceof Error ? err.message : 'An unknown error occurred',
        }),
      );
    } finally {
      setPendingTransactionType(null);
    }
  };

  // Handle failed transaction confirmation
  const handleTransactionFail = () => {
    setPendingTransactionType(null);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'staking' && userAddress) {
      // Refresh staking data when switching to staking tab
      dispatch(fetchStakingData(userAddress));
    } else if (value === 'activity') {
      dispatch(fetchActivityRewards());
    } else if (value === 'referrals') {
      dispatch(fetchReferralRewards());
    }
  };

  // Show connection message if not connected
  if (!isConnected) {
    return (
      <div className="p-4">
        <div className="text-center py-8">
          <h2 className="text-xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-500">Please connect your wallet to view your rewards.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4">
        <Tabs defaultValue="activity" onValueChange={handleTabChange} className="w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold mr-2">Rewards</h1>
              <RefreshButton onRefresh={handleRefresh} isLoading={refreshing} />
            </div>
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
            <ErrorBoundary>
              <ActivityRewards
                refreshing={refreshing}
                onInitiateClaimProcess={initiateClaimProcess}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="staking" className="mt-0">
            <ErrorBoundary>
              <StakingRewards refreshing={refreshing} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="referrals" className="mt-0">
            <ErrorBoundary>
              <ReferralRewards
                refreshing={refreshing}
                onInitiateClaimProcess={initiateClaimProcess}
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>

      {/* Transaction Confirmation Modal */}
      <TransactionConfirmationModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSuccess={handleTransactionSuccess}
        onFail={handleTransactionFail}
        rewardAmount={pendingRewardAmount}
      />
    </>
  );
}
