'use client';

import { useState } from 'react';
import {
  Camera,
  Edit,
  Trophy,
  Flame,
  Activity,
  Loader2,
  Star,
  CircleDollarSign,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { IProfile } from '@/lib/supabase/profile';
import { getStorageConfig } from '@/lib/supabase/storageConstants';
import { formatAddress } from '@/utils/crypto';
import { ProfileUploadModal } from './profile-upload-modal';

interface ProfileHeaderProps {
  profile: IProfile;
  isUpdating: boolean;
  isEditing: boolean;
  balance: string;
  onEdit: (isEditing: boolean) => void;
  isPremium?: boolean;
  activitiesCount?: number;
}

export function ProfileHeader({
  profile,
  isUpdating,
  isEditing,
  balance,
  onEdit,
  isPremium = false,
  activitiesCount = 0,
}: ProfileHeaderProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Get storage configuration
  const storageConfig = getStorageConfig();

  const handleAvatarClick = () => {
    setUploadModalOpen(true);
  };

  const handleEditClick = () => {
    onEdit(!isEditing);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center sm:flex-row sm:items-start">
          <div className="relative mb-4 sm:mb-0 sm:mr-6">
            <Avatar className="h-24 w-24 border-4 border-blue-500">
              <AvatarImage
                src={profile.avatar_url || '/placeholder.svg?height=96&width=96'}
                alt="User"
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
            <ProfileUploadModal
              open={uploadModalOpen}
              onClose={() => setUploadModalOpen(false)}
              isUpdating={isUpdating}
              storageConfig={storageConfig}
              currentAvatarUrl={profile.avatar_url}
              username={profile.username}
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold mr-2">{formatAddress(profile.username)}</h2>
                {isPremium && (
                  <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black">
                    <Star className="h-3 w-3 mr-1 fill-black" />
                    Premium
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 sm:mt-0"
                onClick={handleEditClick}
                disabled={isUpdating}
              >
                {isEditing ? (
                  'Cancel'
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" /> Edit Profile
                  </>
                )}
              </Button>
            </div>

            <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>

            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
              <Badge variant="secondary" className="flex items-center">
                <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                Level {profile.level}
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <Flame className="h-3 w-3 mr-1 text-orange-500" />
                {profile.streak_days} Day Streak
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <CircleDollarSign className="h-3 w-3 mr-1 text-blue-500" />
                {balance}
              </Badge>
              <Badge variant="secondary" className="flex items-center">
                <Activity className="h-3 w-3 mr-1 text-green-500" />
                {activitiesCount} Activities
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
