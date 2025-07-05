import React from 'react';
import { motion, Variants } from 'framer-motion';
import { Target, Weight, BarChart3, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { WorkoutExercise } from '@/types/workouts';

interface ExerciseStatsCardsProps {
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
  containerVariants: Variants;
  itemVariants: Variants;
}

export const ExerciseStatsCards: React.FC<ExerciseStatsCardsProps> = ({
  exerciseStats,
  currentExercise,
  weightUnit,
  containerVariants,
  itemVariants,
}) => (
  <motion.div
    className="grid grid-cols-1 md:grid-cols-4 gap-4"
    variants={containerVariants}
    initial="hidden"
    animate="show"
  >
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Current Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{exerciseStats?.completionPercentage}%</div>
          <div className="text-xs text-gray-500 mb-2">
            {currentExercise.completed_sets}/{currentExercise.sets} sets
          </div>
          <Progress value={exerciseStats?.completionPercentage} className="h-2" />
        </CardContent>
      </Card>
    </motion.div>
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
            <Weight className="h-4 w-4 mr-2" />
            Current Weight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{currentExercise.weight}</div>
          <div className="text-xs text-gray-500">{weightUnit}</div>
          {exerciseStats?.currentProgress && (
            <div className="text-xs text-green-600 mt-1">
              Best: {exerciseStats.currentProgress.bestWeight} {weightUnit}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Total Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{exerciseStats?.totalVolume.toLocaleString()}</div>
          <div className="text-xs text-gray-500">{weightUnit} this session</div>
          {exerciseStats?.currentProgress && (
            <div className="text-xs text-blue-600 mt-1">
              Best: {exerciseStats.currentProgress.bestVolume.toLocaleString()} {weightUnit}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
    <motion.div variants={itemVariants}>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Total Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {exerciseStats?.currentProgress?.totalSessions || 1}
          </div>
          <div className="text-xs text-gray-500">workout sessions</div>
          {exerciseStats?.currentProgress && (
            <div className="text-xs text-purple-600 mt-1">
              Avg: {Math.round(exerciseStats.currentProgress.averageWeight)} {weightUnit}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  </motion.div>
);
