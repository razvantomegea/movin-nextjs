import React, { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateExerciseData, UpdateExerciseData, WorkoutExercise } from '@/types/workouts';

export interface ExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise?: WorkoutExercise;
  workoutId: string;
  onSave: (data: CreateExerciseData | { exerciseId: string; data: UpdateExerciseData }) => void;
}

export function ExerciseModal({
  isOpen,
  onClose,
  exercise,
  workoutId,
  onSave,
}: ExerciseModalProps) {
  const { address } = useAppKitAccount();
  const [formData, setFormData] = useState({
    address: address!,
    exercise_name: '',
    sets: 1,
    reps: 1,
    weight: 0,
    time_under_tension: 0,
    exercise_duration: 0,
    rest_time: 60,
    notes: '',
  });

  useEffect(() => {
    if (exercise) {
      setFormData({
        address: address!,
        exercise_name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        time_under_tension: exercise.time_under_tension,
        exercise_duration: exercise.exercise_duration,
        rest_time: exercise.rest_time,
        notes: exercise.notes || '',
      });
    } else {
      setFormData({
        address: address!,
        exercise_name: '',
        sets: 1,
        reps: 1,
        weight: 0,
        time_under_tension: 0,
        exercise_duration: 0,
        rest_time: 60,
        notes: '',
      });
    }
  }, [exercise, isOpen, address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (exercise) {
      onSave({
        exerciseId: exercise.id,
        data: formData,
      });
    } else {
      onSave({
        workout_id: workoutId,
        ...formData,
      } as CreateExerciseData);
    }

    onClose();
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{exercise ? 'Edit Exercise' : 'Add New Exercise'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exercise-name">Exercise Name</Label>
            <Input
              id="exercise-name"
              value={formData.exercise_name}
              onChange={(e) => handleChange('exercise_name', e.target.value)}
              placeholder="e.g., Bench Press, Squats, etc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sets">Sets</Label>
              <Input
                id="sets"
                type="number"
                min="1"
                value={formData.sets}
                onChange={(e) => handleChange('sets', parseInt(e.target.value) || 1)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input
                id="reps"
                type="number"
                min="1"
                value={formData.reps}
                onChange={(e) => handleChange('reps', parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                step="0.5"
                value={formData.weight}
                onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rest-time">Rest Time (seconds)</Label>
              <Input
                id="rest-time"
                type="number"
                min="0"
                value={formData.rest_time}
                onChange={(e) => handleChange('rest_time', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="time-under-tension">Time Under Tension (seconds)</Label>
              <Input
                id="time-under-tension"
                type="number"
                min="0"
                value={formData.time_under_tension}
                onChange={(e) => handleChange('time_under_tension', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exercise-duration">Exercise Duration (seconds)</Label>
              <Input
                id="exercise-duration"
                type="number"
                min="0"
                value={formData.exercise_duration}
                onChange={(e) => handleChange('exercise_duration', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="exercise-notes">Notes (Optional)</Label>
            <Textarea
              id="exercise-notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any notes about this exercise..."
              rows={2}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{exercise ? 'Update Exercise' : 'Add Exercise'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
