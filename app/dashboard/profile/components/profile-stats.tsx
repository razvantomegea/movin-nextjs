'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { IProfile } from '@/lib/supabase/profile';

interface ProfileStatsProps {
  profile: IProfile;
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Stats</CardTitle>
        <CardDescription>Your activity statistics</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Steps</div>
              <div className="text-2xl font-bold">124,568</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Distance</div>
              <div className="text-2xl font-bold">87.3 km</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Workouts</div>
              <div className="text-2xl font-bold">32</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Calories</div>
              <div className="text-2xl font-bold">15,420</div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-sm text-gray-500 dark:text-gray-400">Best Streak</div>
            <div className="text-2xl font-bold">{profile.streak_days} days</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
