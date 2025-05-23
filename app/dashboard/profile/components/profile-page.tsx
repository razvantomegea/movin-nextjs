'use client';

import { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import { RefreshButton } from '@/components/refresh-button';
// import TokenBalanceExample from '@/components/TokenBalanceExample';
import { useMovinToken } from '@/lib/hooks/useMovinToken';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchProfile, clearProfileError, updateProfile } from '@/lib/redux/slices/profileSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { IProfile } from '@/lib/supabase/profile';
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
  const addressLower = address?.toLowerCase();
  const dispatch = useAppDispatch();
  const { profile, isLoading, isUpdating, error } = useAppSelector((state) => state.profile);
  const { useTokenBalance } = useMovinToken();
  const {
    formattedBalanceWithSuffix: balance,
    isLoading: isBalanceLoading,
    error: balanceError,
  } = useTokenBalance();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (addressLower) {
      dispatch(fetchProfile(addressLower));
    }
  }, [dispatch, addressLower]);

  const handleRefresh = async () => {
    if (!addressLower) {
      return;
    }

    try {
      await dispatch(fetchProfile(addressLower)).unwrap();
      dispatch(
        showSuccessToast({
          title: 'Profile Refreshed',
          description: 'Your profile data has been updated',
        }),
      );
    } catch (error) {
      dispatch(
        showErrorToast({
          title: 'Refresh Failed',
          description: (error as string) || 'Please try again later',
        }),
      );
    }
  };

  const handleDismissError = () => {
    dispatch(clearProfileError());
  };

  const handleSave = async (profileData: Partial<IProfile>) => {
    try {
      if (!addressLower) {
        throw new Error('Wallet address not available');
      }

      // Update profile directly without using Redux
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

  if (isLoading || isBalanceLoading) {
    return <ProfilePageSkeleton />;
  }

  const errorMessage = error || balanceError?.message;

  if (errorMessage) {
    return <ProfileLoadingError error={errorMessage} onRefresh={handleRefresh} />;
  }

  if (!profile) {
    return <ProfileNotFound onRefresh={handleRefresh} />;
  }

  return (
    <>
      <ProfileError error={error} onDismiss={handleDismissError} />
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
              profile={profile}
              balance={balance}
              isUpdating={isUpdating}
              isEditing={isEditing}
              onEdit={setIsEditing}
            />
            {isEditing && (
              <ProfileEditForm
                address={addressLower}
                profile={profile}
                isUpdating={isUpdating}
                onSave={handleSave}
              />
            )}
          </motion.div>

          <motion.div variants={item}>
            <ProfileTabs profile={profile} />
          </motion.div>

          {/* <motion.div variants={item}>
            <TokenBalanceExample />
          </motion.div> */}
        </div>
      </motion.div>
    </>
  );
}
