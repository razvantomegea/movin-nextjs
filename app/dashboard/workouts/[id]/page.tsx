'use client';

import React, { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Plus, Edit, ArrowLeft, Weight } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { CelebrationAnimation } from '@/components/celebration-animation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BaseModal } from '@/components/ui/base-modal';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  createExerciseAction,
  updateExerciseAction,
  deleteExerciseAction,
  clearError as clearExerciseError,
} from '@/lib/redux/slices/exercisesSlice';
import { createPost } from '@/lib/redux/slices/socialFeedSlice';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import {
  fetchWorkoutWithExercises,
  updateWorkoutAction,
  clearCurrentWorkout,
  clearError,
} from '@/lib/redux/slices/workoutsSlice';
import type {
  CreateExerciseData,
  UpdateExerciseData,
  WorkoutExercise,
  WorkoutWithExercises,
} from '@/types/workouts';
import { formatDuration, formatDate } from '@/utils';
import {
  createAchievementData,
  generateAchievementPostContent,
  AchievementTypeEnum,
} from '@/utils/achievements/shareAchievement';
import { getMetricStats } from '@/utils/workouts/getMetricStats';
import { ExerciseCard } from '../components/exercise-card';
import { ExerciseModal } from '../components/exercise-modal';

// Utility to get achievement key and last best data from localStorage
function getWorkoutAchievementKeyAndData(addressLower: string, workout: WorkoutWithExercises) {
  const exercises = workout.workout_exercises || [];
  const totalSets = exercises.reduce((sum: number, ex: WorkoutExercise) => sum + ex.sets, 0);
  const totalVolume = workout.total_volume || 0;
  const bestWeight = exercises.reduce(
    (max: number, ex: WorkoutExercise) => Math.max(max, ex.weight || 0),
    0,
  );

  // Use only stable identifiers for the achievement key
  const achievementKey = `workout_best_${addressLower}_${workout.id}`;
  let lastBest = { volume: 0, reps: 0, weight: 0 };
  const lastBestRaw = localStorage.getItem(achievementKey);

  if (lastBestRaw) {
    try {
      lastBest = JSON.parse(lastBestRaw);
    } catch (e) {
      // Ignore JSON parse error, use default lastBest
    }
  }
  return { achievementKey, lastBest, totalSets, totalVolume, bestWeight };
}

export default function WorkoutPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAppKitAccount();
  const dispatch = useAppDispatch();
  const { currentWorkout, loading, error } = useAppSelector((state) => state.workouts);
  const { error: exerciseError } = useAppSelector((state) => state.exercises);
  const { profile } = useAppSelector((state) => state.profile);

  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | undefined>();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);

  // Achievement states
  const [showCelebration, setShowCelebration] = useState(false);

  const workoutId = params.id as string;
  const addressLower = address?.toLowerCase();

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
      dispatch(showErrorToast({ title: 'Error', description: error }));
      dispatch(clearError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (exerciseError) {
      dispatch(showErrorToast({ title: 'Error', description: exerciseError }));
      dispatch(clearExerciseError());
    }
  }, [exerciseError, dispatch]);

  useEffect(() => {
    if (currentWorkout) {
      setEditName(currentWorkout.name || '');
      setEditNotes(currentWorkout.notes || '');
    }
  }, [currentWorkout]);

  // Achievement celebration tracking
  useEffect(() => {
    if (!currentWorkout || !addressLower) return;

    const { achievementKey, lastBest, totalSets, totalVolume, bestWeight } =
      getWorkoutAchievementKeyAndData(addressLower, currentWorkout);
    const exercises = currentWorkout.workout_exercises || [];
    const totalCompleted = exercises.reduce((sum, ex) => sum + ex.completed_sets, 0);
    const completionPercentage = totalSets > 0 ? Math.round((totalCompleted / totalSets) * 100) : 0;

    // Use getMetricStats for improvement calculation
    const volumeStats = getMetricStats(
      [{ volume: lastBest.volume }, { volume: totalVolume }],
      'volume',
    );
    const repsStats = getMetricStats([{ reps: lastBest.reps }, { reps: totalSets }], 'reps');
    const weightStats = getMetricStats(
      [{ weight: lastBest.weight }, { weight: bestWeight }],
      'weight',
    );

    // Only show celebration if any metric is improved
    const isImproved =
      volumeStats.improvement > 0 || repsStats.improvement > 0 || weightStats.improvement > 0;

    if (completionPercentage >= 100 && isImproved) {
      const timer = setTimeout(() => {
        setShowCelebration(true);
        // Save new bests
        localStorage.setItem(
          achievementKey,
          JSON.stringify({
            volume: Math.max(totalVolume, lastBest.volume),
            reps: Math.max(totalSets, lastBest.reps),
            weight: Math.max(bestWeight, lastBest.weight),
          }),
        );
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [currentWorkout, addressLower]);

  const handleSaveExercise = async (
    data: CreateExerciseData | { exerciseId: string; data: UpdateExerciseData },
  ) => {
    try {
      if ('exerciseId' in data) {
        await dispatch(
          updateExerciseAction({ exerciseId: data.exerciseId, exerciseData: data.data }),
        ).unwrap();
        dispatch(showSuccessToast({ title: 'Exercise updated successfully!' }));
      } else {
        await dispatch(createExerciseAction(data)).unwrap();
        dispatch(showSuccessToast({ title: 'Exercise added successfully!' }));
      }
      // Refresh the workout to get updated totals
      dispatch(fetchWorkoutWithExercises(workoutId));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Failed to save exercise' }));
    }
  };

  const handleDeleteExercise = (exerciseId: string) => {
    setExerciseToDelete(exerciseId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!exerciseToDelete) return;
    try {
      await dispatch(deleteExerciseAction(exerciseToDelete)).unwrap();
      dispatch(showSuccessToast({ title: 'Exercise deleted successfully!' }));
      dispatch(fetchWorkoutWithExercises(workoutId));
    } catch (error) {
      dispatch(showErrorToast({ title: 'Failed to delete exercise' }));
    }
    setShowDeleteConfirm(false);
    setExerciseToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setExerciseToDelete(null);
  };

  const handleUpdateProgress = async (exerciseId: string, completedSets: number) => {
    if (!address) return;

    try {
      await dispatch(
        updateExerciseAction({
          exerciseId,
          exerciseData: { address: address.toLowerCase(), completed_sets: completedSets },
        }),
      ).unwrap();
    } catch (error) {
      dispatch(showErrorToast({ title: 'Failed to update progress' }));
    }
  };

  const handleEditWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkout) return;
    try {
      await dispatch(
        updateWorkoutAction({
          workoutId: currentWorkout.id,
          workoutData: { name: editName.trim(), notes: editNotes.trim() || undefined },
        }),
      ).unwrap();
      dispatch(showSuccessToast({ title: 'Workout updated successfully!' }));
      setShowEditModal(false);
    } catch (error) {
      dispatch(showErrorToast({ title: 'Failed to update workout' }));
    }
  };

  // Achievement sharing handler
  const handleShareWorkoutAchievement = async () => {
    if (!addressLower || !currentWorkout) return;

    try {
      const exercises = currentWorkout.workout_exercises || [];
      const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
      const totalVolume = currentWorkout.total_volume;
      const exerciseCount = exercises.length;

      const achievementData = createAchievementData(
        AchievementTypeEnum.workout,
        `${totalSets} sets`,
        'Workout Completed',
        `Completed ${
          currentWorkout.name
        } with ${exerciseCount} exercises and ${totalVolume.toLocaleString()} ${
          profile?.weight_unit || 'kg'
        } total volume!`,
      );

      const postContent = generateAchievementPostContent(achievementData);

      await dispatch(
        createPost({
          address: addressLower,
          postData: { content: postContent },
        }),
      ).unwrap();

      dispatch(
        showSuccessToast({
          title: 'Achievement Shared!',
          description: 'Your workout achievement has been shared with your connections.',
        }),
      );

      setShowCelebration(false);
    } catch (error) {
      console.error('Failed to share workout achievement:', error);
      dispatch(
        showErrorToast({
          title: 'Share Failed',
          description: 'Unable to share achievement. Please try again.',
        }),
      );
    }
  };

  // When user manually closes the celebration, keep it marked as celebrated and update bests
  const handleCloseCelebration = () => {
    if (currentWorkout && addressLower) {
      const { achievementKey, lastBest, totalSets, totalVolume, bestWeight } =
        getWorkoutAchievementKeyAndData(addressLower, currentWorkout);
      // Save the current bests (max of previous and current values)
      localStorage.setItem(
        achievementKey,
        JSON.stringify({
          volume: Math.max(totalVolume, lastBest.volume),
          reps: Math.max(totalSets, lastBest.reps),
          weight: Math.max(bestWeight, lastBest.weight),
        }),
      );
    }

    setShowCelebration(false);
  };

  // Determine preferred weight unit (default to 'kg')
  const preferredWeightUnit = profile?.weight_unit || 'kg';

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
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/workouts')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {currentWorkout.name}
                <Button variant="ghost" size="icon" onClick={() => setShowEditModal(true)}>
                  <Edit className="h-5 w-5" />
                </Button>
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {formatDate(currentWorkout.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Workout Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-6">
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
              <div className="text-2xl font-bold">
                {currentWorkout.total_volume.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">{preferredWeightUnit} lifted</div>
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

        {/* Exercises List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Exercises</h2>
            <Button onClick={() => setShowExerciseModal(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Exercise
            </Button>
          </div>
          <span className="text-sm text-gray-500">
            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''}
          </span>

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
                  workoutId={workoutId}
                  onEdit={(ex) => {
                    setSelectedExercise(ex);
                    setShowExerciseModal(true);
                  }}
                  onDelete={handleDeleteExercise}
                  onUpdateProgress={handleUpdateProgress}
                  weightUnit={preferredWeightUnit}
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

        {/* Edit Workout Modal */}
        <BaseModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title="Edit Workout"
        >
          <form onSubmit={handleEditWorkout} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-workout-name">Workout Name</Label>
              <Input
                id="edit-workout-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-workout-notes">Notes (Optional)</Label>
              <Textarea
                id="edit-workout-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </BaseModal>

        {/* Delete Exercise Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this exercise from your
                workout.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                className={buttonVariants({ variant: 'destructive' })}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Workout Completion Celebration */}
      <CelebrationAnimation
        isOpen={showCelebration}
        onClose={handleCloseCelebration}
        achievementType="workout"
        achievementValue={`${completionPercentage}% Complete`}
        achievementTitle="Workout Completed!"
        description={`Congratulations! You've completed ${currentWorkout.name} with ${
          exercises.length
        } exercises and ${currentWorkout.total_volume.toLocaleString()} ${preferredWeightUnit} total volume!`}
        showReward={false}
        onShare={handleShareWorkoutAchievement}
        showShareButton={!!addressLower}
      />
    </>
  );
}
