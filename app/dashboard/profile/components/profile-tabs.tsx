'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IProfile } from '@/lib/supabase/profile';
import { ProfileAchievements } from './profile-achievements';
import { ProfileStats } from './profile-stats';

interface ProfileTabsProps {
  profile: IProfile;
}

export function ProfileTabs({ profile }: ProfileTabsProps) {
  return (
    <Tabs defaultValue="achievements">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="achievements">Achievements</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>
      <TabsContent value="achievements" className="mt-4">
        <ProfileAchievements />
      </TabsContent>
      <TabsContent value="stats" className="mt-4">
        <ProfileStats profile={profile} />
      </TabsContent>
    </Tabs>
  );
}
