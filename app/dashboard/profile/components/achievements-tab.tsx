'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { IActivity } from '@/lib/supabase/activities';
import { IProfile } from '@/lib/supabase/profile';
import { ProfileAchievements } from './profile-achievements';

interface AchievementsTabProps {
  profile: IProfile;
  activities: IActivity[];
}

export function AchievementsTab({ profile, activities }: AchievementsTabProps) {
  const { useUserStakes } = useMovinEarn();
  const { data: stakesData } = useUserStakes(profile.address);

  // Check if user has any active stakes
  const hasStakes = stakesData?.stakes && stakesData.stakes.length > 0;

  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Track your progress and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileAchievements
            address={profile.address}
            activities={activities}
            profile={profile}
            hasStakes={hasStakes}
          />
        </CardContent>
      </Card>
    </div>
  );
}
