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
import { fetchEnergyData } from '@/lib/redux/slices/energyDataSlice';
import { fetchProfile, updateProfile } from '@/lib/redux/slices/profileSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { fetchWorkouts } from '@/lib/redux/slices/workoutsSlice';
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
  const { workouts, loading: workoutsLoading } = useAppSelector((state) => state.workouts);
  const { energyEntries, isLoading: energyLoading } = useAppSelector((state) => state.energyData);
  const { useTokenBalance } = useMovinToken();
  const {
    formattedBalanceWithSuffix: balance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useTokenBalance(); // no argument
  const searchParams = useSearchParams();
  const targetAddress = searchParams.get('address');
  const isValidAddress = targetAddress && /^0x[a-fA-F0-9]{40}$/i.test(targetAddress);
  const isReadOnly = Boolean(isValidAddress && targetAddress.toLowerCase() !== addressLower);
  // Premium status
  const { usePremiumStatus } = useMovinEarn();
  const { isPremiumActive } = usePremiumStatus();
  const isPremium = isPremiumActive();
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [publicProfile, setPublicProfile] = useState<IPublicProfile | null>(null);
  const [publicProfileError, setPublicProfileError] = useState<string | null>(null);

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!addressLower && !targetAddress) return;
    setRefreshing(true);

    try {
      if (isReadOnly && targetAddress) {
        setPublicProfileError(null);
        try {
          const result = await getPublicProfile({ targetAddress, viewerAddress: addressLower });
          setPublicProfile(result as IPublicProfile);
        } catch (err) {
          setPublicProfileError(
            err instanceof Error ? err.message : 'Failed to load public profile',
          );
        }

        await dispatch(fetchActivities(targetAddress)).unwrap();
        await dispatch(fetchWorkouts(targetAddress)).unwrap();
        await dispatch(fetchEnergyData(targetAddress)).unwrap();
      } else if (addressLower) {
        await dispatch(fetchProfile(addressLower)).unwrap();
        await dispatch(fetchActivities(addressLower)).unwrap();
        await dispatch(fetchWorkouts(addressLower)).unwrap();
        await dispatch(fetchEnergyData(addressLower)).unwrap();
      }
    } catch (error) {
      console.error('Error refreshing profile data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [isReadOnly, targetAddress, addressLower, dispatch]);

  useEffect(() => {
    if (addressLower) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleRefresh, addressLower]);

  const handleSave = useCallback(
    async (profileData: Partial<IProfile>) => {
      if (!addressLower) return;
      setIsUpdating(true);

      try {
        await dispatch(updateProfile({ address: addressLower, profileData })).unwrap();
        setIsEditing(false);
        dispatch(showSuccessToast({ title: 'Profile updated successfully' }));
      } catch (error) {
        console.error('Error updating profile:', error);
        dispatch(showErrorToast({ title: 'Failed to update profile' }));
      } finally {
        setIsUpdating(false);
      }
    },
    [addressLower, dispatch],
  );

  // Helper to get safe profile for components
  const safeProfile = useMemo(() => {
    if (isReadOnly && publicProfile) {
      return publicProfile;
    }
    // fallback: create a dummy IProfile (all required fields)
    return (
      profile || {
        id: '',
        username: '',
        email: '',
        address: addressLower || '',
        avatar_url: '',
        level: 1,
        streak_days: 0,
        last_streak_update: new Date().toISOString(),
        is_premium: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    );
  }, [profile, publicProfile, isReadOnly, addressLower]);

  // Share handler
  const handleShare = useCallback(() => {
    if (!address) return;
    const shareUrl = `${window.location.origin}/profiles/${address}`;
    copyToClipboard(shareUrl);
    dispatch(showSuccessToast({ title: 'Profile link copied to clipboard' }));
  }, [address, dispatch]);

  const loading =
    isConnecting ||
    (!targetAddress && isLoading) ||
    refreshing ||
    isBalanceLoading ||
    isUpdating ||
    activitiesLoading ||
    workoutsLoading ||
    energyLoading;

  // Loading state
  if (loading) {
    return <ProfilePageSkeleton />;
  }

  // Error state
  if ((error && !targetAddress) || balanceError) {
    const usedError = error || balanceError?.message || 'Something went wrong';

    return <ProfileLoadingError error={usedError} onRefresh={handleRefresh} />;
  }

  if (publicProfileError && targetAddress) {
    return (
      <ProfileError error={publicProfileError} onDismiss={() => setPublicProfileError(null)} />
    );
  }

  if (isReadOnly && targetAddress && !loading && !publicProfile) {
    return <ProfileNotFound onRefresh={handleRefresh} />;
  }

  // If no address and not loading, show connection prompt
  if (!address && !isConnecting && !targetAddress) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Connect your wallet to view your profile and track your fitness journey
        </p>
      </div>
    );
  }

  // canEdit: only if not read-only and address is present
  const canEdit = !isReadOnly && !!addressLower;

  return (
    <>
      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <motion.div className="mb-6" variants={item}>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-2">Profile</h1>
            <RefreshButton onRefresh={handleRefresh} isLoading={isLoading} />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your account and view achievements
          </p>
        </motion.div>

        <div className="space-y-6">
          <motion.div variants={item}>
            <ProfileHeader
              profile={safeProfile}
              balance={balance}
              isUpdating={isLoading}
              isEditing={isEditing}
              onEdit={setIsEditing}
              isPremium={isPremium}
              activitiesCount={activities.length}
              workoutsCount={workouts.length}
              mealsCount={energyEntries.length}
              onShare={handleShare}
              canEdit={canEdit}
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
            <ProfileTabs
              profile={safeProfile as IProfile}
              activities={activities}
              workouts={workouts}
              energyEntries={energyEntries}
              isReadOnly={isReadOnly}
            />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
