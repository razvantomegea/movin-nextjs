'use client';

import { useState, useEffect } from 'react';
import { Users, Copy, Send, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchReferralRewards,
  resetReferralRewardsError,
  inviteFriend,
} from '@/lib/redux/slices/referralRewardsSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { ReferralRewardsSkeleton } from './referral-rewards-skeleton';

interface ReferralRewardsProps {
  refreshing: boolean;
}

export function ReferralRewards({ refreshing }: ReferralRewardsProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const dispatch = useAppDispatch();

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
  } = useAppSelector((state) => state.referralRewards);

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchReferralRewards());
  }, [dispatch]);

  const handleClaimReferralRewards = () => {
    console.log('handleClaimReferralRewards');
  };

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralCode).then(
      () => {
        dispatch(
          showSuccessToast({
            title: 'Copied to Clipboard',
            description: 'Referral code copied to clipboard',
          }),
        );
      },
      () => {
        dispatch(
          showErrorToast({
            title: 'Copy Failed',
            description: 'Failed to copy referral code',
          }),
        );
      },
    );
  };

  const handleInviteFriend = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      dispatch(
        showErrorToast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address',
        }),
      );
      return;
    }

    try {
      await dispatch(inviteFriend(inviteEmail)).unwrap();

      dispatch(
        showSuccessToast({
          title: 'Invitation Sent',
          description: `Invitation sent to ${inviteEmail}`,
        }),
      );

      // Clear the input
      setInviteEmail('');
    } catch (err) {
      dispatch(
        showErrorToast({
          title: 'Invitation Failed',
          description: err instanceof Error ? err.message : 'An unknown error occurred',
        }),
      );
    }
  };

  const handleRetryLoadReferrals = () => {
    dispatch(resetReferralRewardsError());
    dispatch(fetchReferralRewards());
  };

  if (referralLoading && !refreshing) {
    return <ReferralRewardsSkeleton />;
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
    );
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
              <span className="text-2xl font-bold text-blue-400">
                {referralTotalRewards.toFixed(1)}
              </span>
              <span className="text-sm ml-1 text-gray-400">MVN earned</span>
            </div>
          </div>

          <LoadingButton
            className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600"
            loading={referralClaiming}
            loadingText="Preparing Transaction..."
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
                <div
                  key={i}
                  className="flex items-center justify-between p-2 border-b border-gray-800 last:border-0"
                >
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
                    <div className="text-green-500 text-right font-medium">
                      +{item.reward.toFixed(1)} MVN
                    </div>
                    <div className="text-xs text-gray-400">{item.status}</div>
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
