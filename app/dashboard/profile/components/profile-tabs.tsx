'use client';

import { useState } from 'react';
import { Trophy, User } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IActivity } from '@/lib/supabase/activities';
import { IProfile } from '@/lib/supabase/profile';
import { AchievementsTab } from './achievements-tab';
import { PersonalInfoTab } from './personal-info-tab';

interface ProfileTabsProps {
  profile: IProfile;
  activities: IActivity[];
}

export function ProfileTabs({ profile, activities }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('achievements');

  return (
    <Tabs defaultValue="activities" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="achievements">
          <Trophy className="h-4 w-4 mr-2" />
          Achievements
        </TabsTrigger>
        <TabsTrigger value="personal">
          <User className="h-4 w-4 mr-2" />
          Personal Info
        </TabsTrigger>
      </TabsList>
      <TabsContent value="achievements">
        <AchievementsTab profile={profile} activities={activities} />
      </TabsContent>
      <TabsContent value="personal">
        <PersonalInfoTab profile={profile} />
      </TabsContent>
    </Tabs>
  );
}
