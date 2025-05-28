'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import ErrorBoundary from '@/components/error-boundary';
import { RefreshButton } from '@/components/ui/refresh-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { ActivityRewards } from './activity-rewards';
import { ReferralRewards } from './referral-rewards';
import { StakingRewards } from './staking-rewards';

export function RewardsDashboard() {
  const { isConnecting } = useAccount();
  const [refreshing, setRefreshing] = useState(isConnecting);

  const handleRefresh = async () => {
    if (!refreshing) {
      setRefreshing(true);
    }
  };

  const handleDataLoaded = () => {
    if (refreshing) {
      setRefreshing(false);
    }
  };

  return (
    <>
      <div className="p-4">
        <Tabs defaultValue="activity" onValueChange={handleRefresh} className="w-full">
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
              <ActivityRewards refreshing={refreshing} onDataLoaded={handleDataLoaded} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="staking" className="mt-0">
            <ErrorBoundary>
              <StakingRewards refreshing={refreshing} onDataLoaded={handleDataLoaded} />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="referrals" className="mt-0">
            <ErrorBoundary>
              <ReferralRewards refreshing={refreshing} onDataLoaded={handleDataLoaded} />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
