'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useMovinToken } from '@/lib/hooks/useMovinToken';
import { useAppSelector } from '@/lib/redux/hooks';
import { formatDate } from '@/utils/date';

export function ActivityRewardsHistory() {
  // Get activity rewards history from Redux
  const { activityRewards } = useAppSelector((state) => state.activityRewards);

  // Get token symbol from useMovinToken
  const { useTokenSymbol } = useMovinToken();
  const { data: tokenSymbol } = useTokenSymbol();

  // Format the rewards for display
  const formattedRewards = useMemo(() => {
    if (!activityRewards || activityRewards.length === 0) {
      return [];
    }

    return activityRewards.map((reward) => ({
      ...reward,
      formattedRewards: `${Number(reward.rewards).toFixed(2)} ${tokenSymbol || 'MVN'}`,
      formattedDate: formatDate(reward.created_at),
    }));
  }, [activityRewards, tokenSymbol]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Activity Rewards History</h2>
      <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="space-y-3">
            {formattedRewards.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No activity rewards history available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                      <th className="px-2 py-2">Rewards</th>
                      <th className="px-2 py-2">Date Claimed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formattedRewards.map((reward) => (
                      <tr key={reward.id} className="border-b border-gray-700 last:border-0">
                        <td className="px-2 py-3 text-blue-500 font-medium">
                          {reward.formattedRewards}
                        </td>
                        <td className="px-2 py-3 text-sm text-gray-500">{reward.formattedDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
