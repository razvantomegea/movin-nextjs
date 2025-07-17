'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock, Dumbbell, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IProfile } from '@/lib/supabase/profile';
import { Workout } from '@/types/workouts';

interface WorkoutsTabProps {
  profile: IProfile;
  workouts: Workout[];
  isReadOnly: boolean;
}

export function WorkoutsTab({ profile, workouts, isReadOnly }: WorkoutsTabProps) {
  const sortedWorkouts = [...workouts].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const totalVolume = workouts.reduce((sum, workout) => sum + workout.total_volume, 0);
  const totalDuration = workouts.reduce((sum, workout) => sum + workout.total_duration, 0);
  const completedWorkouts = workouts.filter((workout) => workout.completed_at).length;
  // Round average duration to the nearest minute to avoid displaying decimals
  const averageDuration = workouts.length > 0 ? Math.round(totalDuration / workouts.length) : 0;

  const formatDuration = (minutes: number) => {
    const rounded = Math.round(minutes);
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Workout Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Workouts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              <Dumbbell className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-2xl font-bold">{workouts.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
              <span className="text-2xl font-bold">{completedWorkouts}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Volume</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-purple-500 mr-2" />
              <span className="text-2xl font-bold">{totalVolume.toFixed(0)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-orange-500 mr-2" />
              <span className="text-2xl font-bold">{formatDuration(averageDuration)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workouts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Dumbbell className="h-5 w-5 mr-2" />
            Recent Workouts
          </CardTitle>
          <CardDescription>
            {isReadOnly ? `${profile.username}'s recent workouts` : 'Your recent workouts'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedWorkouts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No workouts yet</p>
              <p className="text-sm">
                {isReadOnly
                  ? "This user hasn't logged any workouts yet."
                  : 'Start tracking your workouts to see them here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedWorkouts.slice(0, 10).map((workout, index) => (
                <motion.div
                  key={workout.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h3 className="font-semibold text-lg">{workout.name}</h3>
                        {workout.completed_at && (
                          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">
                            Completed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(workout.created_at)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDuration(Math.round(workout.total_duration))}
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          {workout.total_volume.toFixed(0)} volume
                        </div>
                      </div>
                      {workout.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">{workout.notes}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
