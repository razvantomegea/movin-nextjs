import React from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkoutExercise } from '@/types/workouts';

interface ExerciseDetailsCardProps {
  currentExercise: WorkoutExercise;
  weightUnit: string;
  formatDuration: (seconds: number) => string;
}

export const ExerciseDetailsCard: React.FC<ExerciseDetailsCardProps> = ({
  currentExercise,
  weightUnit,
  formatDuration,
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <Calendar className="h-5 w-5 mr-2" />
        Exercise Details
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Sets</label>
          <div className="text-lg font-semibold">{currentExercise.sets}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Reps</label>
          <div className="text-lg font-semibold">{currentExercise.reps}</div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Weight</label>
          <div className="text-lg font-semibold">
            {currentExercise.weight} {weightUnit}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Rest Time</label>
          <div className="text-lg font-semibold">{formatDuration(currentExercise.rest_time)}</div>
        </div>
      </div>
      {currentExercise.time_under_tension > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Time Under Tension
          </label>
          <div className="text-lg font-semibold">
            {formatDuration(currentExercise.time_under_tension)}
          </div>
        </div>
      )}
      {currentExercise.exercise_duration > 0 && (
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Exercise Duration
          </label>
          <div className="text-lg font-semibold">
            {formatDuration(currentExercise.exercise_duration)}
          </div>
        </div>
      )}
      {currentExercise.notes && (
        <div>
          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Notes</label>
          <div className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1">
            {currentExercise.notes}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);
