'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IActivity } from '@/lib/supabase/activities';
import { ProfileStats } from './profile-stats';

interface ActivitiesTabProps {
  activities: IActivity[];
}

export function ActivitiesTab({ activities }: ActivitiesTabProps) {
  return (
    <div className="space-y-6 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Activities</CardTitle>
          <CardDescription>Your recent fitness activities and stats</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileStats activities={activities} />
        </CardContent>
      </Card>
    </div>
  );
}
