'use client';

import React, { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import {
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  ArrowLeft,
  Play,
  Pause,
  Timer,
  Weight,
  Hash,
  Target,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchExercises,
  createExerciseAction,
  updateExerciseAction,
  deleteExerciseAction,
  clearError as clearExerciseError,
} from '@/lib/redux/slices/exercisesSlice';
import {
  fetchWorkoutWithExercises,
  updateWorkoutAction,
  completeWorkoutAction,
  clearCurrentWorkout,
  clearError,
} from '@/lib/redux/slices/workoutsSlice';
import type {
  CreateExerciseData,
  UpdateExerciseData,
  WorkoutExercise,
} from '@/lib/supabase/workouts';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseModal } from '../components/ExerciseModal';

export default function WorkoutPage() {
  const params = useParams();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const { currentWorkout, loading, error } = useAppSelector((state) => state.workouts);
  const { error: exerciseError } = useAppSelector((state) => state.exercises);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | undefined>();
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  const workoutId = params.id as string;

  useEffect(() => {
    if (workoutId) {
      dispatch(fetchWorkoutWithExercises(workoutId));
    }

    return () => {
      dispatch(clearCurrentWorkout());
    };
  }, [dispatch, workoutId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (exerciseError) {
      toast.error(exerciseError);
      dispatch(clearExerciseError());
    }
  }, [exerciseError, dispatch]);

  const handleSaveExercise = async (
    data: CreateExerciseData | { exerciseId: string; data: UpdateExerciseData },
  ) => {
    try {
      if ('exerciseId' in data) {
        await dispatch(
          updateExerciseAction({ exerciseId: data.exerciseId, exerciseData: data.data }),
        ).unwrap();
        toast.success('Exercise updated successfully!');
      } else {
        await dispatch(createExerciseAction(data)).unwrap();
        toast.success('Exercise added successfully!');
      }
      // Refresh the workout to get updated totals
      dispatch(fetchWorkoutWithExercises(workoutId));
    } catch (error) {
      toast.error('Failed to save exercise');
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (confirm('Are you sure you want to delete this exercise?')) {
      try {
        await dispatch(deleteExerciseAction(exerciseId)).unwrap();
        toast.success('Exercise deleted successfully!');
        // Refresh the workout to get updated totals
        dispatch(fetchWorkoutWithExercises(workoutId));
      } catch (error) {
        toast.error('Failed to delete exercise');
      }
    }
  };

  const handleUpdateProgress = async (exerciseId: string, completedSets: number) => {
    try {
      await dispatch(
        updateExerciseAction({
          exerciseId,
          exerciseData: { completed_sets: completedSets },
        }),
      ).unwrap();
    } catch (error) {
      toast.error('Failed to update progress');
    }
  };

  const handleCompleteWorkout = async () => {
    if (!currentWorkout) return;

    try {
      await dispatch(completeWorkoutAction(currentWorkout.id)).unwrap();
      toast.success('Workout completed! Great job! 🎉');
      setIsWorkoutActive(false);
    } catch (error) {
      toast.error('Failed to complete workout');
    }
  };

  const startWorkout = () => {
    setWorkoutStartTime(new Date());
    setIsWorkoutActive(true);
    toast.success('Workout started! 💪');
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentWorkout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Workout not found</h1>
          <Button onClick={() => router.push('/dashboard/workouts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workouts
          </Button>
        </div>
      </div>
    );
  }

  const exercises = currentWorkout.workout_exercises || [];
  const totalCompleted = exercises.reduce((sum, ex) => sum + ex.completed_sets, 0);
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const completionPercentage = totalSets > 0 ? Math.round((totalCompleted / totalSets) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/workouts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{currentWorkout.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {formatDate(currentWorkout.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!currentWorkout.is_completed && (
            <>
              {!isWorkoutActive ? (
                <Button onClick={startWorkout} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Start Workout
                </Button>
              ) : (
                <Button onClick={handleCompleteWorkout} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Complete Workout
                </Button>
              )}
            </>
          )}

          <Button onClick={() => setShowExerciseModal(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </div>
      </div>

      {/* Workout Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionPercentage}%</div>
            <div className="text-xs text-gray-500">
              {totalCompleted}/{totalSets} sets completed
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentWorkout.total_volume.toLocaleString()}</div>
            <div className="text-xs text-gray-500">lbs lifted</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(currentWorkout.total_duration)}
            </div>
            <div className="text-xs text-gray-500">total time</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Exercises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exercises.length}</div>
            <div className="text-xs text-gray-500">total exercises</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Badge */}
      <div className="flex items-center space-x-2">
        {currentWorkout.is_completed ? (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        ) : isWorkoutActive ? (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
            <Play className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        ) : (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Not Started
          </Badge>
        )}
      </div>

      {/* Exercises List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Exercises</h2>
          <span className="text-sm text-gray-500">
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
          </span>
        </div>

        {exercises.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Weight className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No exercises yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Add your first exercise to start building your workout!
              </p>
              <Button onClick={() => setShowExerciseModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Exercise
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onEdit={(ex) => {
                  setSelectedExercise(ex);
                  setShowExerciseModal(true);
                }}
                onDelete={handleDeleteExercise}
                onUpdateProgress={handleUpdateProgress}
              />
            ))}
          </div>
        )}
      </div>

      {/* Exercise Modal */}
      <ExerciseModal
        isOpen={showExerciseModal}
        onClose={() => {
          setShowExerciseModal(false);
          setSelectedExercise(undefined);
        }}
        exercise={selectedExercise}
        workoutId={workoutId}
        onSave={handleSaveExercise}
      />
    </div>
  );
}
