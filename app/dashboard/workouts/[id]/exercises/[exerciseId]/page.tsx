'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { ExerciseProgressChart } from '@/app/dashboard/workouts/components/exercise-progress-chart';
import { ExerciseDetailsCard } from '@/app/dashboard/workouts/components/ExerciseDetailsCard';
import { ExerciseHeader } from '@/app/dashboard/workouts/components/ExerciseHeader';
import { ExerciseProgressSummary } from '@/app/dashboard/workouts/components/ExerciseProgressSummary';
import { ExerciseStatsCards } from '@/app/dashboard/workouts/components/ExerciseStatsCards';
import { Button } from '@/components/ui/button';
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
  const progressData: ExerciseProgress[] = useMemo(
    () =>
      (exerciseProgress[workoutId]?.[currentExercise?.exercise_name || ''] as ExerciseProgress[]) ||
      [],
    [exerciseProgress, workoutId, currentExercise?.exercise_name],
  );

  // Calculate exercise stats
  const exerciseStats = useMemo(() => {
    if (!currentExercise) return null;

    // Calculate total volume from individual sets if available, otherwise use legacy calculation
    let totalVolume = 0;
    if (currentExercise.exercise_sets && currentExercise.exercise_sets.length > 0) {
      // Sum volume from each individual set (reps * weight per set)
      totalVolume = currentExercise.exercise_sets.reduce((sum: number, set: any) => {
        return sum + set.reps * set.weight;
      }, 0);
    } else {
      // Fall back to legacy calculation for backwards compatibility
      totalVolume = currentExercise.sets * currentExercise.reps * currentExercise.weight;
    }

    const completionPercentage =
      currentExercise.sets > 0
        ? Math.round((currentExercise.completed_sets / currentExercise.sets) * 100)
        : 0;

    // Calculate progress from historical data
    const currentProgress =
      progressData.length > 0
        ? {
            bestWeight: Math.max(...progressData.map((p) => p.maxWeight)),
            bestVolume: Math.max(...progressData.map((p) => p.totalVolume)),
            totalSessions: progressData.length,
            averageWeight:
              progressData.reduce((sum, p) => sum + p.maxWeight, 0) / progressData.length,
          }
        : null;

    return {
      totalVolume,
      completionPercentage,
      currentProgress,
    };
  }, [currentExercise, progressData]);

  // Get preferred weight unit
  const weightUnit = profile?.weight_unit || 'kg';

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
      <ExerciseHeader
        exerciseName={currentExercise.exercise_name}
        workoutName={currentWorkout?.name}
        createdAt={currentExercise.created_at}
        completedSets={currentExercise.completed_sets}
        sets={currentExercise.sets}
        onBack={() => router.push(`/dashboard/workouts/${workoutId}`)}
        variants={item}
      />

      {/* Exercise Stats Cards */}
      <ExerciseStatsCards
        exerciseStats={exerciseStats}
        currentExercise={currentExercise}
        weightUnit={weightUnit}
        containerVariants={container}
        itemVariants={item}
      />

      {/* Exercise Details and Progress Summary */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <ExerciseDetailsCard
            currentExercise={currentExercise}
            weightUnit={weightUnit}
            formatDuration={formatDuration}
          />
        </motion.div>
        <motion.div variants={item}>
          <ExerciseProgressSummary
            exerciseStats={exerciseStats}
            currentExercise={currentExercise}
            weightUnit={weightUnit}
          />
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
