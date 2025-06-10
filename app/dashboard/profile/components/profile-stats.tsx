'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { IActivity } from '@/lib/supabase/activities';
import { formatDistance } from '@/utils';

interface ProfileStatsProps {
  activities?: IActivity[];
}

export function ProfileStats({ activities = [] }: ProfileStatsProps) {
  const stats = useMemo(() => {
    // Calculate total steps
    const totalSteps = activities.reduce((sum, activity) => {
      return sum + (activity.total_steps || 0);
    }, 0);

    // Calculate total distance in meters
    const totalDistanceMeters = activities.reduce((sum, activity) => {
      return sum + (activity.total_distance || 0);
    }, 0);

    // Calculate total workouts
    const totalWorkouts = activities.length;

    // Calculate total calories
    const totalCalories = activities.reduce((sum, activity) => {
      return sum + (activity.total_energy_burned || 0);
    }, 0);

    return {
      totalSteps,
      totalDistanceMeters,
      totalWorkouts,
      totalCalories,
    };
  }, [activities]);

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
              <div className="text-2xl font-bold">
                {stats.totalSteps > 0 ? stats.totalSteps.toLocaleString() : 'No data yet'}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Distance</div>
              <div className="text-2xl font-bold">
                {stats.totalDistanceMeters > 0
                  ? formatDistance(stats.totalDistanceMeters)
                  : 'No data yet'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Workouts</div>
              <div className="text-2xl font-bold">
                {stats.totalWorkouts > 0 ? stats.totalWorkouts : 'No data yet'}
              </div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
              <div className="text-sm text-gray-500 dark:text-gray-400">Calories</div>
              <div className="text-2xl font-bold">
                {stats.totalCalories > 0 ? stats.totalCalories.toLocaleString() : 'No data yet'}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
