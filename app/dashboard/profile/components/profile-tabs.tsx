'use client';

import { useState } from 'react';
import { Trophy, User, Dumbbell, Utensils } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IActivity } from '@/lib/supabase/activities';
import { IEnergy } from '@/lib/supabase/energy';
import { IProfile } from '@/lib/supabase/profile';
import { Workout } from '@/types/workouts';
import { AchievementsTab } from './achievements-tab';
import { MealsTab } from './meals-tab';
import { PersonalInfoTab } from './personal-info-tab';
import { WorkoutsTab } from './workouts-tab';

interface ProfileTabsProps {
  profile: IProfile;
  activities: IActivity[];
  workouts: Workout[];
  energyEntries: IEnergy[];
  isReadOnly: boolean;
}

export function ProfileTabs({
  profile,
  activities,
  workouts,
  energyEntries,
  isReadOnly,
}: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState('achievements');

  return (
    <Tabs defaultValue="achievements" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="achievements">
          <Trophy className="h-4 w-4 xs:mr-2" />
          <span className="hidden xs:inline">Achievements</span>
        </TabsTrigger>
        <TabsTrigger value="workouts">
          <Dumbbell className="h-4 w-4 xs:mr-2" />
          <span className="hidden xs:inline">Workouts</span>
        </TabsTrigger>
        <TabsTrigger value="meals">
          <Utensils className="h-4 w-4 xs:mr-2" />
          <span className="hidden xs:inline">Meals</span>
        </TabsTrigger>
        <TabsTrigger value="personal">
          <User className="h-4 w-4 xs:mr-2" />
          <span className="hidden xs:inline">Personal Info</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="achievements">
        <AchievementsTab profile={profile} activities={activities} isReadOnly={isReadOnly} />
      </TabsContent>
      <TabsContent value="workouts">
        <WorkoutsTab profile={profile} workouts={workouts} isReadOnly={isReadOnly} />
      </TabsContent>
      <TabsContent value="meals">
        <MealsTab profile={profile} energyEntries={energyEntries} isReadOnly={isReadOnly} />
      </TabsContent>
      <TabsContent value="personal">
        <PersonalInfoTab profile={profile} />
      </TabsContent>
    </Tabs>
  );
}
