import type { WorkoutExercise, ExerciseSet } from '@/types/workouts';

/**
 * Calculate progress metrics for a workout exercise.
 * Returns maxWeight, totalVolume, completedSets, totalReps, totalTUT.
 */
export function calculateExerciseProgressMetrics(exercise: WorkoutExercise): {
  maxWeight: number;
  totalVolume: number;
  completedSets: number;
  totalReps: number;
  totalTimeUnderTension: number;
} {
  let maxWeight = 0;
  let totalVolume = 0;
  let completedSets = 0;
  let totalReps = 0;
  let totalTimeUnderTension = 0;

  if (exercise.exercise_sets && exercise.exercise_sets.length > 0) {
    // Calculate from individual sets
    exercise.exercise_sets.forEach((set: ExerciseSet) => {
      if (set.completed) {
        maxWeight = Math.max(maxWeight, set.weight || 0);
        totalVolume += set.reps * (set.weight || 0);
        completedSets++;
        totalReps += set.reps;
        totalTimeUnderTension += set.time_under_tension || 0;
      }
    });
  } else {
    // Fall back to legacy calculation
    maxWeight = exercise.weight || 0;
    totalVolume = (exercise.completed_sets || 0) * (exercise.reps || 0) * (exercise.weight || 0);
    completedSets = exercise.completed_sets || 0;
    totalReps = (exercise.completed_sets || 0) * (exercise.reps || 0);
    totalTimeUnderTension = exercise.time_under_tension || 0;
  }

  return { maxWeight, totalVolume, completedSets, totalReps, totalTimeUnderTension };
}
