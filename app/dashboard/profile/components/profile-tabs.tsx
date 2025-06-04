'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IActivity } from '@/lib/supabase/activities';
import { IProfile } from '@/lib/supabase/profile';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { ProfileAchievements } from './profile-achievements';
import { ProfileStats } from './profile-stats';

interface ProfileTabsProps {
  profile: IProfile;
  activities?: IActivity[];
}

export function ProfileTabs({ profile, activities = [] }: ProfileTabsProps) {
  const { useUserStakes } = useMovinEarn();
  const { data: stakesData } = useUserStakes(profile.address);

  // Check if user has any active stakes
  const hasStakes = stakesData?.stakes && stakesData.stakes.length > 0;

  return (
    <Tabs defaultValue="achievements">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>
      <TabsContent value="achievements" className="mt-4">
        <ProfileAchievements
          address={profile.address}
          activities={activities}
          profile={profile}
          hasStakes={hasStakes}
        />
      </TabsContent>
      <TabsContent value="stats" className="mt-4">
        <ProfileStats profile={profile} activities={activities} />
      </TabsContent>
    </Tabs>
  );
}
