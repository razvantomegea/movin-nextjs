import React from 'react';
import { TrendingUp } from 'lucide-react';
import { CircularProgress } from '@/components/circular-progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WorkoutExercise } from '@/types/workouts';

interface ExerciseProgressSummaryProps {
  exerciseStats: {
    completionPercentage: number;
    currentProgress: {
      bestWeight: number;
      bestVolume: number;
      totalSessions: number;
      averageWeight: number;
    } | null;
    totalVolume: number;
  } | null;
  currentExercise: WorkoutExercise;
  weightUnit: string;
}

export const ExerciseProgressSummary: React.FC<ExerciseProgressSummaryProps> = ({
  exerciseStats,
  currentExercise,
  weightUnit,
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center">
        <TrendingUp className="h-5 w-5 mr-2" />
        Progress Summary
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="text-center">
        <CircularProgress
          value={exerciseStats?.completionPercentage || 0}
          size={120}
          strokeWidth={10}
        />
        <div className="mt-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Session Progress</div>
          <div className="text-lg font-semibold">
            {currentExercise.completed_sets} of {currentExercise.sets} sets
          </div>
        </div>
      </div>
      {exerciseStats?.currentProgress && (
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Best Weight</div>
            <div className="text-lg font-semibold">
              {exerciseStats.currentProgress.bestWeight} {weightUnit}
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-sm text-gray-600 dark:text-gray-400">Best Volume</div>
            <div className="text-lg font-semibold">
              {exerciseStats.currentProgress.bestVolume.toLocaleString()} {weightUnit}
            </div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);
