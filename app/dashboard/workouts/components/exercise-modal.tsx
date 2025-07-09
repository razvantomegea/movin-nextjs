import React, { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { useSelector } from 'react-redux';
import { Autocomplete } from '@/components/ui/autocomplete';
import { BaseModal } from '@/components/ui/base-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RootState } from '@/lib/redux/store';
import { getUniqueExerciseNames } from '@/lib/supabase/workouts';
import type {
  CreateExerciseData,
  UpdateExerciseData,
  WorkoutExercise,
  TempExerciseSet,
} from '@/types/workouts';

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
  const { profile } = useSelector((state: RootState) => state.profile);
  const weightUnit = profile?.weight_unit || 'kg';
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    address: address?.toLowerCase() as string,
    exercise_name: '',
    notes: '',
  });
  const [exerciseSets, setExerciseSets] = useState<TempExerciseSet[]>([
    {
      reps: 1,
      weight: 0,
      duration: 0, // This will be auto-calculated
      time_under_tension: 0,
      rest_time: 60,
      completed: false,
      notes: '',
    },
  ]);

  // Auto-calculate duration for each set based on rest_time + time_under_tension
  const calculateDuration = (restTime: number, timeUnderTension: number): number => {
    return restTime + timeUnderTension;
  };

  // Load exercise names for autocomplete
  useEffect(() => {
    const loadExerciseNames = async () => {
      if (address) {
        try {
          const names = await getUniqueExerciseNames(address);
          setExerciseNames(names);
        } catch (error) {
          console.error('Error loading exercise names:', error);
        }
      }
    };

    if (isOpen && address) {
      loadExerciseNames();
    }
  }, [isOpen, address]);

  useEffect(() => {
    if (exercise) {
      setFormData({
        address: address?.toLowerCase() as string,
        exercise_name: exercise.exercise_name,
        notes: exercise.notes || '',
      });

      // If exercise has set data, use it, otherwise create default sets
      if (exercise.exercise_sets && exercise.exercise_sets.length > 0) {
        const setsData = exercise.exercise_sets.map((set) => ({
          id: set.id,
          reps: set.reps,
          weight: set.weight,
          duration: calculateDuration(set.rest_time, set.time_under_tension), // Auto-calculated from existing data
          time_under_tension: set.time_under_tension,
          rest_time: set.rest_time,
          completed: set.completed,
          notes: set.notes || '',
        }));
        setExerciseSets(setsData);
      } else {
        // Create default sets based on exercise summary
        const timeUnderTension = Math.round(exercise.time_under_tension / (exercise.sets || 1)) || 0;
        const restTime = exercise.rest_time || 60;
        const defaultSets = Array.from({ length: exercise.sets || 1 }, (_, index) => ({
          id: `temp-${index + 1}`,
          reps: Math.round(exercise.reps / (exercise.sets || 1)) || 1,
          weight: exercise.weight || 0,
          duration: calculateDuration(restTime, timeUnderTension), // Auto-calculated
          time_under_tension: timeUnderTension,
          rest_time: restTime,
          completed: false,
          notes: '',
        }));
        setExerciseSets(defaultSets);
      }
    } else {
      setFormData({
        address: address?.toLowerCase() as string,
        exercise_name: '',
        notes: '',
      });
      setExerciseSets([
        {
          reps: 1,
          weight: 0,
          duration: calculateDuration(60, 0), // Auto-calculated (rest_time: 60, time_under_tension: 0)
          time_under_tension: 0,
          rest_time: 60,
          completed: false,
          notes: '',
        },
      ]);
    }
  }, [exercise, isOpen, address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.exercise_name.trim()) {
      alert('Exercise name is required');
      return;
    }

    // Validate each set
    for (let i = 0; i < exerciseSets.length; i++) {
      const set = exerciseSets[i];
      if (!set.reps || set.reps <= 0) {
        alert(`Set ${i + 1}: Reps must be greater than 0`);
        return;
      }
      if (!set.weight || set.weight <= 0) {
        alert(`Set ${i + 1}: Weight must be greater than 0`);
        return;
      }
      if (set.time_under_tension < 0) {
        alert(`Set ${i + 1}: Time Under Tension cannot be negative`);
        return;
      }
      if (set.rest_time < 0) {
        alert(`Set ${i + 1}: Rest Time cannot be negative`);
        return;
      }
    }

    // Create exercise sets data for the database with auto-calculated duration
    const exerciseSetsData = exerciseSets.map((set) => ({
      address: address?.toLowerCase() as string,
      exercise_id: '', // Will be set by the backend
      set_number: 0, // Will be set by the backend
      reps: set.reps,
      weight: set.weight,
      duration: calculateDuration(set.rest_time, set.time_under_tension), // Auto-calculated
      time_under_tension: set.time_under_tension,
      rest_time: set.rest_time,
      completed: set.completed,
      notes: set.notes || undefined,
    }));

    const exerciseData = {
      ...formData,
      address: address?.toLowerCase() as string,
      exercise_sets: exerciseSetsData,
    };

    if (exercise) {
      onSave({
        exerciseId: exercise.id,
        data: exerciseData,
      });
    } else {
      onSave({
        workout_id: workoutId,
        ...exerciseData,
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

  const handleSetChange = (
    setIndex: number,
    field: keyof TempExerciseSet,
    value: string | number | boolean,
  ) => {
    setExerciseSets((prev) =>
      prev.map((set, index) => {
        if (index === setIndex) {
          const updatedSet = { ...set, [field]: value };
          // Auto-calculate duration when rest_time or time_under_tension changes
          if (field === 'rest_time' || field === 'time_under_tension') {
            updatedSet.duration = calculateDuration(updatedSet.rest_time, updatedSet.time_under_tension);
          }
          return updatedSet;
        }
        return set;
      }),
    );
  };

  const addSet = () => {
    const lastSet = exerciseSets[exerciseSets.length - 1];
    const newSet: TempExerciseSet = {
      reps: lastSet?.reps || 1,
      weight: lastSet?.weight || 0,
      duration: calculateDuration(lastSet?.rest_time || 60, lastSet?.time_under_tension || 0), // Auto-calculated
      time_under_tension: lastSet?.time_under_tension || 0,
      rest_time: lastSet?.rest_time || 60,
      completed: false,
      notes: '',
    };
    setExerciseSets([...exerciseSets, newSet]);
  };

  const removeSet = (setIndex: number) => {
    if (exerciseSets.length > 1) {
      setExerciseSets(exerciseSets.filter((_, index) => index !== setIndex));
    }
  };

  // If address is not available, show a message and do not render the modal content
  if (!address) {
    return isOpen ? (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Wallet Connection Required"
        subtitle="Please connect your wallet to add or edit exercises."
        contentClassName="p-6"
      >
        <div className="text-center text-gray-600 dark:text-gray-300">
          You need to connect your wallet to use this feature.
        </div>
        <div className="flex justify-end mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </BaseModal>
    ) : null;
  }

  const footer = (
    <div className="p-6">
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form="exercise-form">
          {exercise ? 'Update Exercise' : 'Add Exercise'}
        </Button>
      </div>
    </div>
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={exercise ? 'Edit Exercise' : 'Add New Exercise'}
      subtitle="Configure your exercise details and sets"
      footer={footer}
      contentClassName="p-6"
    >
      <form id="exercise-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-semibold">*</span> indicates required fields
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exercise-name">Exercise Name *</Label>
          <Autocomplete
            id="exercise-name"
            value={formData.exercise_name}
            onChange={(value) => handleChange('exercise_name', value)}
            suggestions={exerciseNames}
            placeholder="e.g., Bench Press, Squats, etc."
            required
          />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">
              Sets Configuration ({exerciseSets.length})
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSet}
              className="flex items-center gap-1"
            >
              <span className="text-lg">+</span>
              Add Set
            </Button>
          </div>

          {exerciseSets.map((set, index) => (
            <div
              key={set.id || index}
              className="p-4 border rounded-lg space-y-4 bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-base">Set {index + 1}</h4>
                {exerciseSets.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeSet(index)}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <span className="text-lg">-</span>
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`set-${index}-reps`}>Reps *</Label>
                  <Input
                    id={`set-${index}-reps`}
                    type="number"
                    min="1"
                    value={set.reps}
                    onChange={(e) => handleSetChange(index, 'reps', parseInt(e.target.value) || 1)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`set-${index}-weight`}>Weight ({weightUnit}) *</Label>
                  <Input
                    id={`set-${index}-weight`}
                    type="number"
                    min="1"
                    step="0.5"
                    value={set.weight}
                    onChange={(e) =>
                      handleSetChange(index, 'weight', parseFloat(e.target.value) || 1)
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`set-${index}-time-under-tension`}>
                    Time Under Tension (seconds) *
                  </Label>
                  <Input
                    id={`set-${index}-time-under-tension`}
                    type="number"
                    min="0"
                    value={set.time_under_tension}
                    onChange={(e) =>
                      handleSetChange(index, 'time_under_tension', parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`set-${index}-rest-time`}>Rest Time (seconds) *</Label>
                  <Input
                    id={`set-${index}-rest-time`}
                    type="number"
                    min="0"
                    value={set.rest_time}
                    onChange={(e) =>
                      handleSetChange(index, 'rest_time', parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`set-${index}-total-time`}>Total Time (auto-calculated)</Label>
                  <Input
                    id={`set-${index}-total-time`}
                    type="number"
                    value={calculateDuration(set.rest_time, set.time_under_tension)}
                    disabled
                    className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Rest Time + Time Under Tension
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`set-${index}-notes`}>Set Notes (Optional)</Label>
                  <Input
                    id={`set-${index}-notes`}
                    value={set.notes || ''}
                    onChange={(e) => handleSetChange(index, 'notes', e.target.value)}
                    placeholder="Notes for this set..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="exercise-notes">Exercise Notes (Optional)</Label>
          <Textarea
            id="exercise-notes"
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Add any notes about this exercise..."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            General notes about this exercise that apply to all sets.
          </p>
        </div>
      </form>
    </BaseModal>
  );
}
