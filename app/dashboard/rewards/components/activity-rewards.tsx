'use client';

import { useEffect } from 'react';
import { Flame, History, Award, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { LoadingButton } from '@/components/ui/loading-button';
import { Progress } from '@/components/ui/progress';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchActivityRewards,
  claimActivityRewards,
  resetActivityRewardsError,
} from '@/lib/redux/slices/activityRewardsSlice';
import { ActivityRewardsSkeleton } from './activity-rewards-skeleton';

interface ActivityRewardsProps {
  refreshing: boolean;
  onInitiateClaimProcess: (type: 'staking' | 'activity' | 'referral', amount: number) => void;
}

export function ActivityRewards({ refreshing, onInitiateClaimProcess }: ActivityRewardsProps) {
  const dispatch = useAppDispatch();

  // Activity rewards state
  const {
    totalRewards: activityTotalRewards,
    activityRewards,
    challenges,
    isLoading: activityLoading,
    isClaiming: activityClaiming,
    error: activityError,
  } = useAppSelector((state) => state.activityRewards);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchActivityRewards());
  }, [dispatch]);

  const handleClaimActivityRewards = () => {
    onInitiateClaimProcess('activity', activityTotalRewards);
  };

  const handleRetryLoadActivity = () => {
    dispatch(resetActivityRewardsError());
    dispatch(fetchActivityRewards());
  };

  if (activityLoading && !refreshing) {
    return <ActivityRewardsSkeleton />;
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
    );
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
            loadingText="Preparing Transaction..."
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
                      <span className="text-blue-400 font-medium">
                        +{challenge.reward.toFixed(2)} MVN
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">{challenge.description}</div>
                    <Progress
                      value={(challenge.progress / challenge.total) * 100}
                      className="h-1.5 mt-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
