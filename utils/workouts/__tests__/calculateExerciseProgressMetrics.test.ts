import type { WorkoutExercise } from '@/types/workouts';
import { calculateExerciseProgressMetrics } from '../calculateExerciseProgressMetrics';

describe('calculateExerciseProgressMetrics', () => {
  it('calculates metrics from exercise sets', () => {
    const exercise = {
      exercise_sets: [
        { reps: 10, weight: 50, completed: true, time_under_tension: 30 },
        { reps: 8, weight: 55, completed: true, time_under_tension: 40 },
        { reps: 6, weight: 60, completed: false, time_under_tension: 50 },
      ],
    };
    const result = calculateExerciseProgressMetrics(exercise as WorkoutExercise);
    expect(result.maxWeight).toBe(55);
    expect(result.totalVolume).toBe(10 * 50 + 8 * 55);
    expect(result.completedSets).toBe(2);
    expect(result.totalReps).toBe(18);
    expect(result.totalTimeUnderTension).toBe(70);
  });

  it('calculates metrics from legacy fields', () => {
    const exercise = {
      sets: 3,
      reps: 8,
      weight: 60,
      completed_sets: 2,
      time_under_tension: 45,
    };
    const result = calculateExerciseProgressMetrics(exercise as WorkoutExercise);
    expect(result.maxWeight).toBe(60);
    expect(result.totalVolume).toBe(2 * 8 * 60); // Reps * weight * sets
    expect(result.completedSets).toBe(2);
    expect(result.totalReps).toBe(16); // Reps * sets
    expect(result.totalTimeUnderTension).toBe(45);
  });

  it('returns zeros for no completed sets', () => {
    const exercise = {
      exercise_sets: [
        { reps: 10, weight: 50, completed: false, time_under_tension: 20 },
        { reps: 8, weight: 55, completed: false, time_under_tension: 30 },
      ],
    };
    const result = calculateExerciseProgressMetrics(exercise as WorkoutExercise);
    expect(result.maxWeight).toBe(0);
    expect(result.totalVolume).toBe(0);
    expect(result.completedSets).toBe(0);
    expect(result.totalReps).toBe(0);
    expect(result.totalTimeUnderTension).toBe(0);
  });
});
