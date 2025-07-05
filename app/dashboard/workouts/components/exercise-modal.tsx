import React, { useEffect, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { Autocomplete } from '@/components/ui/autocomplete';
import { BaseModal } from '@/components/ui/base-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getUniqueExerciseNames } from '@/lib/supabase/workouts';
import type {
  CreateExerciseData,
  UpdateExerciseData,
  WorkoutExercise,
  ExerciseSet,
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
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    address: address as string,
    exercise_name: '',
    sets: 1,
    reps: 1,
    weight: 0,
    time_under_tension: 0,
    exercise_duration: 0,
    rest_time: 60,
    notes: '',
  });
  const [exerciseSets, setExerciseSets] = useState<ExerciseSet[]>([
    {
      id: '1',
      reps: 1,
      weight: 0,
      duration: 0,
      time_under_tension: 0,
      rest_time: 60,
      completed: false,
      notes: '',
    },
  ]);

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
        address: address as string,
        exercise_name: exercise.exercise_name,
        sets: exercise.sets,
        reps: exercise.reps,
        weight: exercise.weight,
        time_under_tension: exercise.time_under_tension,
        exercise_duration: exercise.exercise_duration,
        rest_time: exercise.rest_time,
        notes: exercise.notes || '',
      });

      // If exercise has set data, parse it, otherwise create default sets
      const setsData = exercise.sets || 1;
      const defaultSets = Array.from({ length: setsData }, (_, index) => ({
        id: (index + 1).toString(),
        reps: exercise.reps || 1,
        weight: exercise.weight || 0,
        duration: exercise.exercise_duration || 0,
        time_under_tension: exercise.time_under_tension || 0,
        rest_time: exercise.rest_time || 60,
        completed: false,
        notes: '',
      }));
      setExerciseSets(defaultSets);
    } else {
      setFormData({
        address: address as string,
        exercise_name: '',
        sets: 1,
        reps: 1,
        weight: 0,
        time_under_tension: 0,
        exercise_duration: 0,
        rest_time: 60,
        notes: '',
      });
      setExerciseSets([
        {
          id: '1',
          reps: 1,
          weight: 0,
          duration: 0,
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

    // Calculate totals from sets
    const totalSets = exerciseSets.length;
    const totalReps = exerciseSets.reduce((sum: number, set: ExerciseSet) => sum + set.reps, 0);
    const averageWeight =
      exerciseSets.reduce((sum: number, set: ExerciseSet) => sum + set.weight, 0) / totalSets;
    const totalDuration = exerciseSets.reduce(
      (sum: number, set: ExerciseSet) => sum + set.duration,
      0,
    );
    const totalTimeUnderTension = exerciseSets.reduce(
      (sum: number, set: ExerciseSet) => sum + set.time_under_tension,
      0,
    );
    const averageRestTime =
      exerciseSets.reduce((sum: number, set: ExerciseSet) => sum + set.rest_time, 0) / totalSets;

    const exerciseData = {
      ...formData,
      address: address as string,
      sets: totalSets,
      reps: Math.round(totalReps / totalSets), // Average reps per set
      weight: averageWeight,
      exercise_duration: totalDuration,
      time_under_tension: totalTimeUnderTension,
      rest_time: Math.round(averageRestTime),
      exercise_sets: exerciseSets,
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
    field: keyof ExerciseSet,
    value: string | number | boolean,
  ) => {
    setExerciseSets((prev) =>
      prev.map((set, index) => (index === setIndex ? { ...set, [field]: value } : set)),
    );
  };

  const addSet = () => {
    const newSet: ExerciseSet = {
      id: (exerciseSets.length + 1).toString(),
      reps: exerciseSets[exerciseSets.length - 1]?.reps || 1,
      weight: exerciseSets[exerciseSets.length - 1]?.weight || 0,
      duration: exerciseSets[exerciseSets.length - 1]?.duration || 0,
      time_under_tension: exerciseSets[exerciseSets.length - 1]?.time_under_tension || 0,
      rest_time: exerciseSets[exerciseSets.length - 1]?.rest_time || 60,
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
        maxWidth="sm"
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
      maxWidth="2xl"
      footer={footer}
      contentClassName="p-6"
    >
      <form id="exercise-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="exercise-name">Exercise Name</Label>
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
              key={set.id}
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
                  <Label htmlFor={`set-${index}-reps`}>Reps</Label>
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
                  <Label htmlFor={`set-${index}-weight`}>Weight (lbs)</Label>
                  <Input
                    id={`set-${index}-weight`}
                    type="number"
                    min="0"
                    step="0.5"
                    value={set.weight}
                    onChange={(e) =>
                      handleSetChange(index, 'weight', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`set-${index}-duration`}>Duration (seconds)</Label>
                  <Input
                    id={`set-${index}-duration`}
                    type="number"
                    min="0"
                    value={set.duration}
                    onChange={(e) =>
                      handleSetChange(index, 'duration', parseInt(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`set-${index}-time-under-tension`}>
                    Time Under Tension (seconds)
                  </Label>
                  <Input
                    id={`set-${index}-time-under-tension`}
                    type="number"
                    min="0"
                    value={set.time_under_tension}
                    onChange={(e) =>
                      handleSetChange(index, 'time_under_tension', parseInt(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`set-${index}-rest-time`}>Rest Time (seconds)</Label>
                  <Input
                    id={`set-${index}-rest-time`}
                    type="number"
                    min="0"
                    value={set.rest_time}
                    onChange={(e) =>
                      handleSetChange(index, 'rest_time', parseInt(e.target.value) || 0)
                    }
                  />
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
