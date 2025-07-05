import { getClient } from './createClient';
import type {
  Workout,
  WorkoutExercise,
  CreateWorkoutData,
  UpdateWorkoutData,
  CreateExerciseData,
  UpdateExerciseData,
  WorkoutWithExercises,
  WorkoutStatsRow,
  ExerciseWithWorkout,
} from '../../types/workouts';

// Workout CRUD operations
export async function createWorkout(
  address: string,
  workoutData: CreateWorkoutData,
): Promise<Workout> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('workouts')
    .insert({
      address: address.toLowerCase(),
      ...workoutData,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getWorkouts(address: string): Promise<Workout[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('address', address.toLowerCase())
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getWorkout(workoutId: string): Promise<Workout> {
  const supabase = getClient();

  const { data, error } = await supabase.from('workouts').select('*').eq('id', workoutId).single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getWorkoutWithExercises(workoutId: string): Promise<WorkoutWithExercises> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('workouts')
    .select(
      `
      *,
      workout_exercises (*)
    `,
    )
    .eq('id', workoutId)
    .single();

  if (error) {
    throw error;
  }

  // Sort exercises by order_index
  if (data.workout_exercises) {
    data.workout_exercises.sort(
      (a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index,
    );
  }

  return data;
}

export async function updateWorkout(
  workoutId: string,
  workoutData: UpdateWorkoutData,
): Promise<Workout> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('workouts')
    .update(workoutData)
    .eq('id', workoutId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteWorkout(workoutId: string): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase.from('workouts').delete().eq('id', workoutId);

  if (error) {
    throw error;
  }
}

// Exercise CRUD operations
export async function createExercise(exerciseData: CreateExerciseData): Promise<WorkoutExercise> {
  const supabase = getClient();

  // Get the next order index for this workout
  const { data: maxOrderData } = await supabase
    .from('workout_exercises')
    .select('order_index')
    .eq('workout_id', exerciseData.workout_id)
    .order('order_index', { ascending: false })
    .limit(1);

  const nextOrderIndex =
    maxOrderData && maxOrderData.length > 0 ? maxOrderData[0].order_index + 1 : 0;

  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      ...exerciseData,
      order_index: exerciseData.order_index ?? nextOrderIndex,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getExercises(workoutId: string): Promise<WorkoutExercise[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('workout_exercises')
    .select('*')
    .eq('workout_id', workoutId)
    .order('order_index', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function updateExercise(
  exerciseId: string,
  exerciseData: UpdateExerciseData,
): Promise<WorkoutExercise> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('workout_exercises')
    .update(exerciseData)
    .eq('id', exerciseId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteExercise(exerciseId: string): Promise<void> {
  const supabase = getClient();

  const { error } = await supabase.from('workout_exercises').delete().eq('id', exerciseId);

  if (error) {
    throw error;
  }
}

export async function reorderExercises(workoutId: string, exerciseIds: string[]): Promise<void> {
  const supabase = getClient();

  // Use RPC to reorder exercises atomically
  const { error } = await supabase.rpc('reorder_workout_exercises', {
    exercise_ids: exerciseIds,
    order_indices: exerciseIds.map((_, idx) => idx),
  });

  if (error) {
    throw error;
  }
}

// Analytics functions
export async function getWorkoutStats(
  address: string,
  startDate?: string,
  endDate?: string,
): Promise<{
  totalWorkouts: number;
  totalVolume: number;
  totalDuration: number;
  averageWorkoutDuration: number;
  completedWorkouts: number;
}> {
  const supabase = getClient();

  let query = supabase
    .from('workouts')
    .select('total_volume, total_duration')
    .eq('address', address.toLowerCase());

  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const statsData = (data || []) as WorkoutStatsRow[];

  const totalWorkouts = statsData.length;
  const totalVolume = statsData.reduce(
    (sum: number, workout: WorkoutStatsRow) => sum + (workout.total_volume || 0),
    0,
  );
  const totalDuration = statsData.reduce(
    (sum: number, workout: WorkoutStatsRow) => sum + (workout.total_duration || 0),
    0,
  );
  const completedWorkouts = statsData.length;
  const averageWorkoutDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

  return {
    totalWorkouts,
    totalVolume,
    totalDuration,
    averageWorkoutDuration,
    completedWorkouts,
  };
}

export async function getExerciseProgress(
  address: string,
  exerciseName: string,
  limit = 10,
): Promise<
  {
    date: string;
    maxWeight: number;
    totalVolume: number;
    totalSets: number;
    totalReps: number;
  }[]
> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('workout_exercises')
    .select(
      `
      *,
      workouts!inner (
        address,
        created_at,
      )
    `,
    )
    .eq('exercise_name', exerciseName)
    .eq('workouts.address', address.toLowerCase())
    .order('workouts.created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  // Group by date and calculate metrics with type safety and volume checks
  type ProgressAccumulator = Record<
    string,
    {
      date: string;
      maxWeight: number;
      totalVolume: number;
      totalSets: number;
      totalReps: number;
    }
  >;

  const progressByDate = (data as unknown as ExerciseWithWorkout[]).reduce(
    (acc: ProgressAccumulator, exercise: ExerciseWithWorkout) => {
      const date = exercise.workouts.created_at.split('T')[0];
      const sets = typeof exercise.sets === 'number' && exercise.sets > 0 ? exercise.sets : 0;
      const reps = typeof exercise.reps === 'number' && exercise.reps > 0 ? exercise.reps : 0;
      const weight =
        typeof exercise.weight === 'number' && exercise.weight > 0 ? exercise.weight : 0;
      const volume = sets * reps * weight;

      if (!acc[date]) {
        acc[date] = {
          date,
          maxWeight: weight,
          totalVolume: volume,
          totalSets: sets,
          totalReps: sets * reps,
        };
      } else {
        acc[date].maxWeight = Math.max(acc[date].maxWeight, weight);
        acc[date].totalVolume += volume;
        acc[date].totalSets += sets;
        acc[date].totalReps += sets * reps;
      }

      return acc;
    },
    {} as ProgressAccumulator,
  );

  return Object.values(progressByDate);
}

// Get unique exercise names for autocomplete
export async function getUniqueExerciseNames(address: string): Promise<string[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('workout_exercises')
    .select('exercise_name')
    .eq('address', address.toLowerCase())
    .order('exercise_name');

  if (error) {
    throw error;
  }

  // Get unique exercise names
  const uniqueNames = [
    ...new Set((data as { exercise_name: string }[]).map((item) => item.exercise_name)),
  ];
  return uniqueNames;
}
