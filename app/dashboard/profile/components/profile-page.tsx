'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { ConnectionRequestButton } from '@/app/profiles/components/connection-request-button';
import { RefreshButton } from '@/components/refresh-button';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { useMovinToken } from '@/lib/hooks/useMovinToken';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchActivities } from '@/lib/redux/slices/activityDataSlice';
import { fetchProfile, updateProfile } from '@/lib/redux/slices/profileSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { IProfile, IPublicProfile, getPublicProfile } from '@/lib/supabase/profile';
import { copyToClipboard } from '@/utils/crypto';
import { ProfileEditForm } from './profile-edit-form';
import { ProfileError, ProfileLoadingError, ProfileNotFound } from './profile-error';
import { ProfileHeader } from './profile-header';
import { ProfilePageSkeleton } from './profile-page-skeleton';
import { ProfileTabs } from './profile-tabs';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function ProfilePage() {
  const { address } = useAppKitAccount();
  const { isConnecting } = useAccount();
  const addressLower = useMemo(() => address?.toLowerCase(), [address]);
  const dispatch = useAppDispatch();
  const { profile, isLoading, error } = useAppSelector((state) => state.profile);
  const { activities, isLoading: activitiesLoading } = useAppSelector(
    (state) => state.activityData,
  );
  const { useTokenBalance } = useMovinToken();
  const {
    formattedBalanceWithSuffix: balance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useTokenBalance();
  const [isEditing, setIsEditing] = useState(false);

  const { usePremiumStatus } = useMovinEarn();
  const { isPremiumActive } = usePremiumStatus();
  const isPremium = isPremiumActive();
  const searchParams = useSearchParams();
  const targetAddress = searchParams.get('address');
  const isReadOnly = Boolean(targetAddress && targetAddress !== addressLower);

  // State for public profile
  const [publicProfile, setPublicProfile] = useState<Partial<IPublicProfile> | null>(null);
  const [publicProfileLoading, setPublicProfileLoading] = useState(false);
  const [publicProfileError, setPublicProfileError] = useState<string | null>(null);

  const handleRefresh = useCallback(async () => {
    if (isReadOnly && targetAddress) {
      setPublicProfileLoading(true);
      setPublicProfileError(null);
      try {
        const result = await getPublicProfile({ targetAddress, viewerAddress: addressLower });
        setPublicProfile(result);
      } catch (err) {
        setPublicProfileError(err instanceof Error ? err.message : 'Failed to load public profile');
      } finally {
        setPublicProfileLoading(false);
      }
      await dispatch(fetchActivities(targetAddress)).unwrap();
    } else if (addressLower) {
      await dispatch(fetchProfile(addressLower)).unwrap();
      await dispatch(fetchActivities(addressLower)).unwrap();
    }
  }, [isReadOnly, targetAddress, addressLower, dispatch]);

  useEffect(() => {
    if (addressLower) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleRefresh, addressLower]);

  const handleSave = async (profileData: Partial<IProfile>) => {
    try {
      if (!addressLower) {
        throw new Error('Wallet address not available');
      }
      await dispatch(updateProfile({ address: addressLower, profileData })).unwrap();
      await dispatch(fetchProfile(addressLower)).unwrap();
      dispatch(
        showSuccessToast({
          title: 'Profile Updated',
          description: 'Your profile has been successfully updated',
        }),
      );
    } catch (error) {
      dispatch(
        showErrorToast({
          title: 'Update Failed',
          description: (error as string) || 'Please try again later',
        }),
      );
    } finally {
      setIsEditing(false);
    }
  };

  // Helper to get safe profile for components
  const getProfileForComponent = () => {
    if (isReadOnly && publicProfile) {
      // Fallbacks for required fields for IProfile
      return {
        id: publicProfile.id || '',
        username: publicProfile.username || '',
        email: publicProfile.email || '',
        address: publicProfile.address || '',
        avatar_url: publicProfile.avatar_url || '',
        level: publicProfile.level || 0,
        streak_days: publicProfile.streak_days || 0,
        is_premium: publicProfile.is_premium || false,
        created_at: publicProfile.created_at || '',
        updated_at: publicProfile.updated_at || '',
        // Optional fields
        last_streak_update: publicProfile.last_streak_update,
        weight: publicProfile.weight,
        weight_unit: publicProfile.weight_unit,
        weight_updated_at: publicProfile.weight_updated_at,
        height: publicProfile.height,
        date_of_birth: publicProfile.date_of_birth,
        biological_sex: publicProfile.biological_sex,
        total_earned: publicProfile.total_earned,
        privacy_setting: publicProfile.privacy_setting,
        allow_connection_requests: publicProfile.allow_connection_requests,
        profile_description: publicProfile.profile_description,
        location: publicProfile.location,
        website: publicProfile.website,
      } as IProfile;
    }

    return profile as IProfile;
  };

  const safeProfile = getProfileForComponent();

  // Share handler
  const handleShare = useCallback(() => {
    const username = safeProfile.username || 'Profile';
    const profileUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/dashboard/profile?address=${safeProfile.address}`
        : '';
    const shareText = `Check out ${username}'s profile on Movin!`;

    if (navigator.share) {
      navigator
        .share({
          title: `Movin Profile: ${username}`,
          text: shareText,
          url: profileUrl,
        })
        .catch(() => {});
    } else {
      copyToClipboard(profileUrl);
      dispatch(
        showSuccessToast({
          title: 'Link copied!',
          description: 'The profile link has been copied to your clipboard.',
        }),
      );
    }
  }, [safeProfile.username, safeProfile.address, dispatch]);

  // Loading state
  if (
    isConnecting ||
    isBalanceLoading ||
    activitiesLoading ||
    (isReadOnly && publicProfileLoading) ||
    (!isReadOnly && isLoading)
  ) {
    return <ProfilePageSkeleton />;
  }

  // Error state
  const errorMessage = (isReadOnly ? publicProfileError : error) || balanceError?.message;
  if (errorMessage) {
    return <ProfileLoadingError error={errorMessage} onRefresh={handleRefresh} />;
  }

  // Profile not found
  const profileToUse = isReadOnly ? publicProfile : profile;
  if (!profileToUse) {
    return <ProfileNotFound onRefresh={handleRefresh} />;
  }

  return (
    <>
      <ProfileError error={isReadOnly ? publicProfileError : error} onDismiss={handleRefresh} />
      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <motion.div className="mb-6" variants={item}>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-2">Profile</h1>
            <RefreshButton
              onRefresh={handleRefresh}
              isLoading={isReadOnly ? publicProfileLoading : isLoading}
            />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your account and view achievements
          </p>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={item}>
            <ProfileHeader
              canEdit={!isReadOnly}
              profile={safeProfile}
              balance={balance}
              isUpdating={isReadOnly ? publicProfileLoading : isLoading}
              isEditing={isEditing}
              onEdit={setIsEditing}
              isPremium={isPremium}
              activitiesCount={activities.length}
              onShare={handleShare}
            />
            {isEditing && !isReadOnly && (
              <ProfileEditForm profile={safeProfile} isUpdating={isLoading} onSave={handleSave} />
            )}
            {isReadOnly && targetAddress && (
              <div className="mt-6">
                <ConnectionRequestButton
                  targetAddress={targetAddress}
                  connectionStatus={
                    publicProfile && 'connection_status' in publicProfile
                      ? publicProfile.connection_status
                      : undefined
                  }
                  connectionId={
                    publicProfile && 'connection_id' in publicProfile
                      ? publicProfile.connection_id
                      : undefined
                  }
                  onConnectionUpdate={handleRefresh}
                />
              </div>
            )}
          </motion.div>

          <motion.div variants={item}>
            <ProfileTabs profile={safeProfile} activities={activities} isReadOnly={isReadOnly} />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
