'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useMovinToken } from '@/lib/hooks/useMovinToken';
import { useAppSelector } from '@/lib/redux/hooks';

// Helper function to format date in a human readable format
function formatDate(dateString: string): string {
  if (!dateString) return 'Invalid Date';

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';

    // Format: "Apr 2, 2025"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
}

export function StakingHistory() {
  // Get staking history from Supabase via Redux
  const { history } = useAppSelector((state) => state.staking);

  // Get token symbol from useMovinToken
  const { useTokenSymbol } = useMovinToken();
  const { data: tokenSymbol } = useTokenSymbol();

  // Format the stakes for display
  const formattedStakes = useMemo(() => {
    if (!history || history.length === 0) {
      return [];
    }

    // Only show completed (inactive) stakes
    return history
      .filter((stake) => !stake.is_active)
      .map((stake) => ({
        ...stake,
        formattedAmount: `${Number(stake.amount).toFixed(2)} ${tokenSymbol}`,
        formattedRewards: `${Number(stake.rewards).toFixed(2)} ${tokenSymbol}`,
        formattedPeriod: `${stake.lock_period_months} ${
          stake.lock_period_months === 1 ? 'month' : 'months'
        }`,
        formattedDate: formatDate(stake.stake_time),
        status: 'Completed',
      }));
  }, [history, tokenSymbol]);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Staking History</h2>
      <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
        <CardContent className="p-4">
          <div className="space-y-3">
            {formattedStakes.length === 0 ? (
              <div className="text-center py-4 text-gray-500">No staking history available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                      <th className="px-2 py-2">Amount</th>
                      <th className="px-2 py-2">APR</th>
                      <th className="px-2 py-2">Period</th>
                      <th className="px-2 py-2">Rewards</th>
                      <th className="px-2 py-2">Start Date</th>
                      <th className="px-2 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formattedStakes.map((stake, index) => (
                      <tr
                        key={stake.id + '-' + index}
                        className="border-b border-gray-700 last:border-0"
                      >
                        <td className="px-2 py-3 font-medium">{stake.formattedAmount}</td>
                        <td className="px-2 py-3 text-green-500">{stake.apr}%</td>
                        <td className="px-2 py-3">{stake.formattedPeriod}</td>
                        <td className="px-2 py-3 text-blue-500">{stake.formattedRewards}</td>
                        <td className="px-2 py-3 text-sm text-gray-500">{stake.formattedDate}</td>
                        <td className="px-2 py-3">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              stake.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {stake.status}
                          </span>
                        </td>
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
