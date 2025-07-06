'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Plus, Dumbbell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { showSuccessToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import {
  fetchWorkouts,
  createWorkoutAction,
  deleteWorkoutAction,
  fetchWorkoutStats,
  clearError,
} from '@/lib/redux/slices/workoutsSlice';
import { formatDuration } from '@/utils';
import { CreateWorkoutModal } from './components/create-workout-modal';
import { WorkoutCard } from './components/workout-card';

export default function WorkoutsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const { workouts, loading, error, stats } = useAppSelector((state) => state.workouts);
  const profile = useAppSelector((state) => state.profile.profile);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (address) {
      dispatch(fetchWorkouts(address));
      dispatch(fetchWorkoutStats({ userAddress: address }));
    }
  }, [dispatch, address]);

  useEffect(() => {
    if (error) {
      dispatch(showErrorToast({ title: 'Error', description: error }));
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleCreateWorkout = async (name: string, notes?: string) => {
    if (!address) return;

    try {
      const result = await dispatch(
        createWorkoutAction({
          userAddress: address,
          workoutData: { name, notes },
        }),
      ).unwrap();

      dispatch(showSuccessToast({ title: 'Workout created successfully!' }));
      router.push(`/dashboard/workouts/${result.id}`);
    } catch (error) {
      dispatch(showErrorToast({ title: 'Failed to create workout' }));
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      try {
        await dispatch(deleteWorkoutAction(workoutId)).unwrap();
        dispatch(showSuccessToast({ title: 'Workout deleted successfully!' }));
      } catch (error) {
        dispatch(showErrorToast({ title: 'Failed to delete workout' }));
      }
    }
  };

  const handleViewWorkout = useCallback(
    (workoutId: string) => {
      router.push(`/dashboard/workouts/${workoutId}`);
    },
    [router],
  );

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please connect your wallet to access workouts</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Workouts</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your fitness progress and manage your workouts
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          New Workout
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Workouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkouts}</div>
              <div className="text-xs text-gray-500">{stats.completedWorkouts} completed</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVolume.toLocaleString()}</div>
              <div className="text-xs text-gray-500">{profile?.weight_unit || 'kg'} lifted</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(stats.totalDuration)}</div>
              <div className="text-xs text-gray-500">workout time</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Avg Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDuration(stats.averageWorkoutDuration)}
              </div>
              <div className="text-xs text-gray-500">per workout</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workouts List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Workouts</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : workouts.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Dumbbell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No workouts yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first workout to start tracking your fitness journey!
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workout
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onView={handleViewWorkout}
                onDelete={handleDeleteWorkout}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Workout Modal */}
      <CreateWorkoutModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreateWorkout={handleCreateWorkout}
      />
    </div>
  );
}
