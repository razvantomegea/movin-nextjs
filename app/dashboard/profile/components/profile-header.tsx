'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Edit,
  Loader2,
  Activity,
  Flame,
  Trophy,
  Star,
  CircleDollarSign,
  Scale,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { IProfile } from '@/lib/supabase/profile';
import { getStorageConfig } from '@/lib/supabase/storageConstants';
import { formatAddress } from '@/utils/crypto';
import { ProfileUploadModal } from './profile-upload-modal';
import { WeightCaptureModal } from './weight-capture-modal';

interface ProfileHeaderProps {
  profile: IProfile;
  balance: string;
  isUpdating: boolean;
  isEditing: boolean;
  onEdit: (editing: boolean) => void;
  isPremium: boolean;
  activitiesCount: number;
}

export function ProfileHeader({
  profile,
  balance,
  isUpdating,
  isEditing,
  onEdit,
  isPremium = false,
  activitiesCount = 0,
}: ProfileHeaderProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);

  // Get storage configuration
  const storageConfig = getStorageConfig();

  const handleAvatarClick = () => {
    setUploadModalOpen(true);
  };

  const handleEditClick = () => {
    onEdit(!isEditing);
  };

  const handleOpenWeightModal = () => {
    setIsWeightModalOpen(true);
  };

  const handleCloseWeightModal = () => {
    setIsWeightModalOpen(false);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not recorded';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      <WeightCaptureModal
        isOpen={isWeightModalOpen}
        onClose={handleCloseWeightModal}
        userAddress={profile.address}
        currentWeightUnit={profile.weight_unit}
      />

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-12 gap-6">
            {/* Avatar and basic info */}
            <div className="col-span-12 flex flex-col items-center">
              <div className="relative mb-4">
                <Avatar className="w-24 h-24 border-4 border-blue-500">
                  <AvatarImage
                    src={profile.avatar_url || '/placeholder.svg?height=96&width=96'}
                    alt={profile.username || 'User'}
                  />
                  <AvatarFallback className="text-2xl dark:bg-blue-900 dark:text-blue-100 bg-blue-100 text-blue-900">
                    {formatAddress(profile.username)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={handleAvatarClick}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </Button>
                {isPremium && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black">
                      <Star className="h-3 w-3 mr-1 fill-black" />
                      Premium
                    </Badge>
                  </div>
                )}
              </div>
              <div className="text-center mt-2">
                <h2 className="text-2xl font-bold">{formatAddress(profile.username)}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm truncate max-w-full">
                  {profile.email || profile.address}
                </p>
                <div className="flex items-center justify-center mt-3">
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditClick}
                      disabled={isUpdating}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats section */}
            <div className="col-span-12">
              <div className="grid grid-cols-2 gap-4">
                {/* Token Balance */}
                <motion.div
                  className={`p-4 rounded-xl flex flex-col items-center justify-center shadow-sm ${
                    isDark ? 'bg-blue-900/20' : 'bg-blue-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 dark:text-gray-300 mb-1 flex items-center">
                    <CircleDollarSign className="h-3.5 w-3.5 mr-1" />
                    Balance
                  </span>
                  <span className="text-xl font-bold">{balance}</span>
                </motion.div>

                {/* Weight */}
                <motion.div
                  className={`p-4 rounded-xl flex flex-col items-center justify-center shadow-sm ${
                    isDark ? 'bg-green-900/20' : 'bg-green-50'
                  } relative cursor-pointer`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  onClick={handleOpenWeightModal}
                >
                  {!isUpdating ? (
                    <>
                      <span className="text-sm text-gray-500 dark:text-gray-300 mb-1 flex items-center">
                        <Scale className="h-3.5 w-3.5 mr-1" />
                        Weight
                      </span>
                      <span className="text-xl font-bold">
                        {profile.weight
                          ? `${profile.weight} ${profile.weight_unit || 'kg'}`
                          : 'Add Weight'}
                      </span>
                      {profile.weight_updated_at && (
                        <span className="text-xs text-gray-500 mt-1">
                          {formatDate(profile.weight_updated_at)}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-1 right-1 h-6 w-6 p-0 rounded-full opacity-60 hover:opacity-100"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-7 w-16" />
                    </>
                  )}
                </motion.div>

                {/* Level */}
                <motion.div
                  className={`p-4 rounded-xl flex flex-col items-center justify-center shadow-sm ${
                    isDark ? 'bg-purple-900/20' : 'bg-purple-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 dark:text-gray-300 mb-1 flex items-center">
                    <Trophy className="h-3.5 w-3.5 mr-1" />
                    Level
                  </span>
                  <span className="text-xl font-bold">{profile.level || 1}</span>
                </motion.div>

                {/* Activity Count */}
                <motion.div
                  className={`p-4 rounded-xl flex flex-col items-center justify-center shadow-sm ${
                    isDark ? 'bg-orange-900/20' : 'bg-orange-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-sm text-gray-500 dark:text-gray-300 mb-1 flex items-center">
                    <Activity className="h-3.5 w-3.5 mr-1" />
                    Activities
                  </span>
                  <span className="text-xl font-bold">{activitiesCount}</span>
                </motion.div>
              </div>

              {/* Streak info */}
              <div className="mt-4 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 p-3 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <Flame className="h-5 w-5 mr-2 text-orange-500" />
                  <span className="font-medium">{profile.streak_days || 0} Day Streak</span>
                </div>
                <span className="text-xs text-gray-500">
                  Last updated: {formatDate(profile.last_streak_update)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ProfileUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        isUpdating={isUpdating}
        storageConfig={storageConfig}
        currentAvatarUrl={profile.avatar_url}
        username={profile.username}
      />
    </>
  );
}
