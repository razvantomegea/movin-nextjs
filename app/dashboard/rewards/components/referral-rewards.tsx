'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Users, Copy, Send, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Input } from '@/components/ui/input';
import { LoadingButton } from '@/components/ui/loading-button';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { useAppDispatch } from '@/lib/redux/hooks';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { ReferralRewardsSkeleton } from './referral-rewards-skeleton';

interface ReferralRewardsProps {
  refreshing: boolean;
}

export function ReferralRewards({ refreshing }: ReferralRewardsProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = useMemo(() => address?.toLowerCase() || '', [address]);

  // Get hooks from useMovinEarn
  const { useReferralInfo, useUserReferrals, useRegisterReferral } = useMovinEarn();

  // Get referral info
  const {
    formattedReferralInfo,
    isLoading: referralInfoLoading,
    error: referralInfoError,
    refetch: refetchReferralInfo,
  } = useReferralInfo();

  // Get user referrals
  const {
    data: userReferrals,
    isLoading: referralsLoading,
    error: referralsError,
  } = useUserReferrals();

  // Register referral hook
  const {
    registerReferral,
    isPending: isRegistering,
    error: registerError,
  } = useRegisterReferral();

  // Format referral info
  const referralInfo = useMemo(() => formattedReferralInfo(), [formattedReferralInfo]);

  // Generate referral link
  const referralLink = useMemo(() => {
    if (!addressLower) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://getmovin.ai';
    return `${baseUrl}?referral=${addressLower}`;
  }, [addressLower]);

  // Format referrals data for display
  const referrals = useMemo(() => {
    if (!userReferrals || !referralInfo) return [];

    return userReferrals.map((address, index) => ({
      id: index + 1,
      name: `User ${index + 1}`,
      status: 'Active' as const,
      reward: 1.5, // Default reward per referral
      date: new Date(Date.now() - index * 86400000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    }));
  }, [userReferrals, referralInfo]);

  // Calculate total rewards
  const totalRewards = useMemo(() => {
    if (!referralInfo) return 0;
    return parseFloat(referralInfo.earnedBonus);
  }, [referralInfo]);

  // Check if loading
  const isLoading = referralInfoLoading || referralsLoading || refreshing;

  // Check for error
  const error = referralInfoError?.message || referralsError?.message || registerError?.message;

  // Handle claim referral rewards
  const handleClaimReferralRewards = () => {
    console.log('handleClaimReferralRewards');
  };

  // Handle copy referral code
  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(referralLink).then(
      () => {
        dispatch(
          showSuccessToast({
            title: 'Copied to Clipboard',
            description: 'Referral link copied to clipboard',
          }),
        );
      },
      () => {
        dispatch(
          showErrorToast({
            title: 'Copy Failed',
            description: 'Failed to copy referral link',
          }),
        );
      },
    );
  };

  // Handle invite friend
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
      setIsInviting(true);
      // Here you would integrate with an email service to send invites
      // This is a mock implementation similar to the previous one
      await new Promise((resolve) => setTimeout(resolve, 1500));

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
    } finally {
      setIsInviting(false);
    }
  };

  const handleRetryLoadReferrals = () => {
    refetchReferralInfo();
  };

  if (isLoading && !refreshing) {
    return <ReferralRewardsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <ErrorAlert message={error} />
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
              <span className="text-4xl font-bold text-blue-400">
                {referralInfo?.referralCount || 0}
              </span>
            </div>
            <span className="text-sm text-gray-400">Total referrals</span>

            <div className="flex items-center mt-4">
              <span className="text-2xl font-bold text-blue-400">{totalRewards.toFixed(1)}</span>
              <span className="text-sm ml-1 text-gray-400">MVN earned</span>
            </div>
          </div>

          <LoadingButton
            className="w-full py-6 text-lg bg-blue-500 hover:bg-blue-600"
            loading={false}
            loadingText="Preparing Transaction..."
            onClick={handleClaimReferralRewards}
            disabled={totalRewards <= 0}
          >
            Claim Rewards
          </LoadingButton>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-medium">Your Referral Link</h2>
        <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-lg font-medium bg-gray-800 p-2 rounded flex-1 text-center overflow-hidden text-ellipsis">
                {referralLink}
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

      {referralInfo?.referrer &&
        referralInfo.referrer !== '0x0000000000000000000000000000000000000000' && (
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Your Referrer</h2>
            <Card className="bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-800">
              <CardContent className="p-4">
                <div className="font-mono text-sm break-all">{referralInfo.referrer}</div>
              </CardContent>
            </Card>
          </div>
        )}

      {referrals.length > 0 && (
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
      )}
    </div>
  );
}
