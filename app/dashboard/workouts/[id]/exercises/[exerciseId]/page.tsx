'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Target, Calendar, Weight, BarChart3, Activity } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { ExerciseProgressChart } from '@/app/dashboard/workouts/components/exercise-progress-chart';
import { CircularProgress } from '@/components/circular-progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchExerciseProgress, setCurrentExercise } from '@/lib/redux/slices/exercisesSlice';
import { showErrorToast } from '@/lib/redux/slices/toastSlice';
import { fetchWorkoutWithExercises } from '@/lib/redux/slices/workoutsSlice';
import type { RootState } from '@/lib/redux/store';
import type { ExerciseProgress, WorkoutExercise } from '@/types/workouts';
import { formatDuration } from '@/utils';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAppKitAccount();
  const dispatch = useAppDispatch();

  const { currentWorkout, loading: workoutLoading } = useAppSelector(
    (state: RootState) => state.workouts,
  );
  const {
    currentExercise,
    loading: exerciseLoading,
    error: exerciseError,
    exerciseProgress,
  } = useAppSelector((state: RootState) => state.exercises);
  const { profile } = useAppSelector((state: RootState) => state.profile);

  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'volume' | 'reps'>('weight');

  const workoutId = params.id as string;
  const exerciseId = params.exerciseId as string;

  // Fetch workout and exercise data
  useEffect(() => {
    if (workoutId) {
      dispatch(fetchWorkoutWithExercises(workoutId));
    }
  }, [dispatch, workoutId]);

  // Set current exercise when workout is loaded
  useEffect(() => {
    if (currentWorkout && exerciseId) {
      const exercise = currentWorkout.workout_exercises?.find(
        (ex: WorkoutExercise) => ex.id === exerciseId,
      );
      if (exercise) {
        dispatch(setCurrentExercise(exercise));
      }
    }
  }, [currentWorkout, exerciseId, dispatch]);

  // Fetch exercise progress when exercise is set
  useEffect(() => {
    if (currentExercise && address) {
      dispatch(
        fetchExerciseProgress({
          userAddress: address,
          workoutId: workoutId,
          exerciseName: currentExercise.exercise_name,
          limit: 30, // Last 30 sessions
        }),
      );
    }
  }, [currentExercise, address, workoutId, dispatch]);

  // Handle errors
  useEffect(() => {
    if (exerciseError) {
      dispatch(showErrorToast({ title: 'Error', description: exerciseError }));
    }
  }, [exerciseError, dispatch]);

  // Get progress data for charts
  const progressData = useMemo(
    () => exerciseProgress[workoutId]?.[currentExercise?.exercise_name || ''] || [],
    [exerciseProgress, workoutId, currentExercise?.exercise_name],
  );

  // Calculate exercise stats
  const exerciseStats = useMemo(() => {
    if (!currentExercise) return null;

    const totalVolume = currentExercise.sets * currentExercise.reps * currentExercise.weight;
    const completionPercentage =
      currentExercise.sets > 0
        ? Math.round((currentExercise.completed_sets / currentExercise.sets) * 100)
        : 0;

    // Calculate progress from historical data
    const currentProgress =
      progressData.length > 0
        ? {
            bestWeight: Math.max(...progressData.map((p: ExerciseProgress) => p.maxWeight)),
            bestVolume: Math.max(...progressData.map((p: ExerciseProgress) => p.totalVolume)),
            totalSessions: progressData.length,
            averageWeight:
              progressData.reduce((sum: number, p: ExerciseProgress) => sum + p.maxWeight, 0) /
              progressData.length,
          }
        : null;

    return {
      totalVolume,
      completionPercentage,
      currentProgress,
    };
  }, [currentExercise, progressData]);

  // Get preferred weight unit
  const weightUnit = profile?.weight_unit === 'lb' ? 'lb' : 'kg';

  if (workoutLoading || exerciseLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Exercise not found</h1>
          <Button onClick={() => router.push(`/dashboard/workouts/${workoutId}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workout
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        variants={item}
        initial="hidden"
        animate="show"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/workouts/${workoutId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{currentExercise.exercise_name}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {currentWorkout?.name} • {new Date(currentExercise.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          {currentExercise.completed_sets}/{currentExercise.sets} sets completed
        </Badge>
      </motion.div>

      {/* Exercise Stats Cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
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

        <motion.div variants={item}>
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

        <motion.div variants={item}>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Total Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {exerciseStats?.totalVolume.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">{weightUnit} this session</div>
              {exerciseStats?.currentProgress && (
                <div className="text-xs text-blue-600 mt-1">
                  Best: {exerciseStats.currentProgress.bestVolume.toLocaleString()} {weightUnit}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
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

      {/* Exercise Details */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
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
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sets
                  </label>
                  <div className="text-lg font-semibold">{currentExercise.sets}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Reps
                  </label>
                  <div className="text-lg font-semibold">{currentExercise.reps}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Weight
                  </label>
                  <div className="text-lg font-semibold">
                    {currentExercise.weight} {weightUnit}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Rest Time
                  </label>
                  <div className="text-lg font-semibold">
                    {formatDuration(currentExercise.rest_time)}
                  </div>
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
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Notes
                  </label>
                  <div className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md mt-1">
                    {currentExercise.notes}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={item}>
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
        </motion.div>
      </motion.div>

      {/* Progress Charts */}
      <motion.div className="space-y-4" variants={item} initial="hidden" animate="show">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Progress Over Time</h2>
          <div className="flex space-x-2">
            <Button
              variant={selectedMetric === 'weight' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('weight')}
            >
              Weight
            </Button>
            <Button
              variant={selectedMetric === 'volume' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('volume')}
            >
              Volume
            </Button>
            <Button
              variant={selectedMetric === 'reps' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedMetric('reps')}
            >
              Total Reps
            </Button>
          </div>
        </div>

        <ExerciseProgressChart
          progressData={progressData}
          selectedMetric={selectedMetric}
          weightUnit={weightUnit}
          isLoading={exerciseLoading}
        />
      </motion.div>
    </div>
  );
}
