'use client';

import React, { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Plus, Trash2, Play, Dumbbell, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchWorkouts,
  createWorkoutAction,
  deleteWorkoutAction,
  fetchWorkoutStats,
  clearError,
} from '@/lib/redux/slices/workoutsSlice';
import { formatDuration, formatDate } from '@/utils';

interface CreateWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateWorkout: (name: string, notes?: string) => void;
}

function CreateWorkoutModal({ isOpen, onClose, onCreateWorkout }: CreateWorkoutModalProps) {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onCreateWorkout(name.trim(), notes.trim() || undefined);
      setName('');
      setNotes('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Workout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workout-name">Workout Name</Label>
            <Input
              id="workout-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Push Day, Full Body, etc."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workout-notes">Notes (Optional)</Label>
            <Textarea
              id="workout-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this workout..."
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Workout</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function WorkoutsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const { workouts, loading, error, stats } = useAppSelector((state) => state.workouts);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (address) {
      dispatch(fetchWorkouts(address));
      dispatch(fetchWorkoutStats({ userAddress: address }));
    }
  }, [dispatch, address]);

  useEffect(() => {
    if (error) {
      toast.error(error);
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

      toast.success('Workout created successfully!');
      router.push(`/dashboard/workouts/${result.id}`);
    } catch (error) {
      toast.error('Failed to create workout');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    if (confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      try {
        await dispatch(deleteWorkoutAction(workoutId)).unwrap();
        toast.success('Workout deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete workout');
      }
    }
  };

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
    <div className="container mx-auto px-4 py-8 space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className="text-xs text-gray-500">lbs lifted</div>
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
              <Card key={workout.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{workout.name}</CardTitle>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(workout.created_at)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400">Volume</div>
                      <div className="text-lg font-semibold">
                        {workout.total_volume.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-600 dark:text-gray-400">Duration</div>
                      <div className="text-lg font-semibold">
                        {formatDuration(workout.total_duration)}
                      </div>
                    </div>
                  </div>

                  {workout.notes && (
                    <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {workout.notes}
                    </div>
                  )}

                  <div className="flex justify-between items-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/workouts/${workout.id}`);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Play className="h-3 w-3" />
                      View
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWorkout(workout.id);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
