'use client';

import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { IActivity } from '@/lib/supabase/activities';
import { IProfile } from '@/lib/supabase/profile';
import { ProfileAchievements } from './profile-achievements';

interface AchievementsTabProps {
  profile: IProfile;
  activities: IActivity[];
  isReadOnly: boolean;
}

export function AchievementsTab({ profile, activities, isReadOnly }: AchievementsTabProps) {
  const { useUserStakes } = useMovinEarn();
  const { data: stakesData } = useUserStakes(profile.address);

  // Check if user has any active stakes
  const hasStakes = stakesData?.stakes && stakesData.stakes.length > 0;

  return (
    <div className="space-y-6 py-4">
      <ProfileAchievements
        activities={activities}
        profile={profile}
        hasStakes={hasStakes}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}
