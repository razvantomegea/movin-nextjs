import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';
import type {
  Workout,
  WorkoutExercise,
  ExerciseSet,
  CreateWorkoutData,
  UpdateWorkoutData,
  CreateExerciseData,
  UpdateExerciseData,
  CreateExerciseSetData,
  UpdateExerciseSetData,
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
      workout_exercises (
        *,
        exercise_sets (*)
      )
    `,
    )
    .eq('id', workoutId)
    .single();

  if (error) {
    throw error;
  }

  // Sort exercises by order_index and sets by set_number
  if (data.workout_exercises) {
    data.workout_exercises.sort(
      (a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index,
    );

    // Sort exercise sets by set_number
    data.workout_exercises.forEach((exercise: WorkoutExercise) => {
      if (exercise.exercise_sets) {
        exercise.exercise_sets.sort(
          (a: ExerciseSet, b: ExerciseSet) => a.set_number - b.set_number,
        );
      }
    });
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

  // Calculate aggregate values from exercise sets
  const setsCount = exerciseData.exercise_sets?.length || 1;
  const totalReps = exerciseData.exercise_sets?.reduce((sum, set) => sum + set.reps, 0) || 1;
  const maxWeight =
    exerciseData.exercise_sets?.reduce((max, set) => Math.max(max, set.weight || 0), 0) || 0;
  const totalDuration =
    exerciseData.exercise_sets?.reduce((sum, set) => sum + (set.duration || 0), 0) || 0;
  const totalTimeUnderTension =
    exerciseData.exercise_sets?.reduce((sum, set) => sum + (set.time_under_tension || 0), 0) || 0;
  const totalRestTime =
    exerciseData.exercise_sets?.reduce((sum, set) => sum + (set.rest_time || 0), 0) || 0;
  const avgRestTime = setsCount > 0 ? totalRestTime / setsCount : 0;

  // Create the exercise first
  const { data: exercise, error: exerciseError } = await supabase
    .from('workout_exercises')
    .insert({
      address: exerciseData.address.toLowerCase(),
      workout_id: exerciseData.workout_id,
      exercise_name: exerciseData.exercise_name,
      notes: exerciseData.notes,
      order_index: exerciseData.order_index ?? nextOrderIndex,
      sets: setsCount,
      reps: totalReps,
      weight: maxWeight,
      time_under_tension: totalTimeUnderTension,
      exercise_duration: totalDuration,
      rest_time: avgRestTime,
    })
    .select()
    .single();

  if (exerciseError) {
    throw exerciseError;
  }

  // Create exercise sets if provided
  if (exerciseData.exercise_sets && exerciseData.exercise_sets.length > 0) {
    const setsData = exerciseData.exercise_sets.map((set, index) => ({
      ...set,
      exercise_id: exercise.id,
      set_number: index + 1,
    }));

    const { error: setsError } = await supabase.from('exercise_sets').insert(setsData);

    if (setsError) {
      throw setsError;
    }
  }

  return exercise;
}

export async function getExercises(workoutId: string): Promise<WorkoutExercise[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('workout_exercises')
    .select(
      `
      *,
      exercise_sets (*)
    `,
    )
    .eq('workout_id', workoutId)
    .order('order_index', { ascending: true });

  if (error) {
    throw error;
  }

  // Sort exercise sets by set_number
  const exercises = data || [];
  exercises.forEach((exercise: WorkoutExercise) => {
    if (exercise.exercise_sets) {
      exercise.exercise_sets.sort((a: ExerciseSet, b: ExerciseSet) => a.set_number - b.set_number);
    }
  });

  return exercises;
}

export async function getExercise(exerciseId: string): Promise<WorkoutExercise> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('workout_exercises')
    .select(
      `
      *,
      exercise_sets (*)
    `,
    )
    .eq('id', exerciseId)
    .single();

  if (error) {
    throw error;
  }

  // Sort exercise sets by set_number
  if (data.exercise_sets) {
    data.exercise_sets.sort((a: ExerciseSet, b: ExerciseSet) => a.set_number - b.set_number);
  }

  return data;
}

export async function updateExercise(
  exerciseId: string,
  exerciseData: UpdateExerciseData,
): Promise<WorkoutExercise> {
  const supabase = getClient();

  // Update exercise sets if provided
  if (exerciseData.exercise_sets) {
    // Fetch existing sets
    const { data: existingSets, error: fetchError } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('exercise_id', exerciseId);
    if (fetchError) throw fetchError;
    const existingSetsByNumber = new Map<number, ExerciseSet>();
    (existingSets || []).forEach((set: ExerciseSet) => {
      existingSetsByNumber.set(set.set_number, set);
    });

    // Track set_numbers in update
    const incomingSetNumbers = new Set<number>();

    // Update or insert sets
    for (let i = 0; i < exerciseData.exercise_sets.length; i++) {
      const incoming = exerciseData.exercise_sets[i];
      const set_number = i + 1;
      incomingSetNumbers.add(set_number);
      const existing = existingSetsByNumber.get(set_number);
      if (existing) {
        // Update, preserve completion unless explicitly provided
        const updateData: Partial<ExerciseSet> = {
          reps: incoming.reps,
          weight: incoming.weight,
          duration: incoming.duration,
          time_under_tension: incoming.time_under_tension,
          rest_time: incoming.rest_time,
          notes: incoming.notes,
        };
        if (typeof incoming.completed !== 'undefined') {
          updateData.completed = incoming.completed;
        } else {
          updateData.completed = existing.completed;
        }
        const { error: updateError } = await supabase
          .from('exercise_sets')
          .update(updateData)
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        // Insert new set
        const insertData = {
          ...incoming,
          exercise_id: exerciseId,
          set_number,
        };
        const { error: insertError } = await supabase.from('exercise_sets').insert(insertData);
        if (insertError) throw insertError;
      }
    }

    // Delete sets not present in update
    for (const set of existingSets || []) {
      if (!incomingSetNumbers.has(set.set_number)) {
        const { error: deleteError } = await supabase
          .from('exercise_sets')
          .delete()
          .eq('id', set.id);
        if (deleteError) throw deleteError;
      }
    }

    // Calculate aggregate values from updated exercise sets
    const setsCount = exerciseData.exercise_sets.length;
    const totalReps = exerciseData.exercise_sets.reduce((sum, set) => sum + set.reps, 0);
    const maxWeight = exerciseData.exercise_sets.reduce(
      (max, set) => Math.max(max, set.weight || 0),
      0,
    );
    const totalDuration = exerciseData.exercise_sets.reduce(
      (sum, set) => sum + (set.duration || 0),
      0,
    );
    const totalTimeUnderTension = exerciseData.exercise_sets.reduce(
      (sum, set) => sum + (set.time_under_tension || 0),
      0,
    );
    const totalRestTime = exerciseData.exercise_sets.reduce(
      (sum, set) => sum + (set.rest_time || 0),
      0,
    );
    const avgRestTime = setsCount > 0 ? totalRestTime / setsCount : 0;

    // Update the exercise with recalculated aggregate values
    const { data: exercise, error: exerciseError } = await supabase
      .from('workout_exercises')
      .update({
        exercise_name: exerciseData.exercise_name,
        notes: exerciseData.notes,
        order_index: exerciseData.order_index,
        sets: setsCount,
        reps: totalReps,
        weight: maxWeight,
        time_under_tension: totalTimeUnderTension,
        exercise_duration: totalDuration,
        rest_time: avgRestTime,
        completed_sets: exerciseData.completed_sets,
      })
      .eq('id', exerciseId)
      .select()
      .single();

    if (exerciseError) {
      throw exerciseError;
    }

    return exercise;
  } else {
    // Update the exercise without touching sets
    const { data: exercise, error: exerciseError } = await supabase
      .from('workout_exercises')
      .update({
        exercise_name: exerciseData.exercise_name,
        notes: exerciseData.notes,
        order_index: exerciseData.order_index,
        completed_sets: exerciseData.completed_sets,
      })
      .eq('id', exerciseId)
      .select()
      .single();

    if (exerciseError) {
      throw exerciseError;
    }

    return exercise;
  }
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

// Exercise Set CRUD operations
export async function createExerciseSet(setData: CreateExerciseSetData): Promise<ExerciseSet> {
  const supabase = getClient();

  const { data, error } = await supabase.from('exercise_sets').insert(setData).select().single();

  if (error) {
    throw error;
  }

  // Recalculate exercise aggregates after creating a new set
  await recalculateExerciseAggregates(supabase, data.exercise_id);

  return data;
}

export async function getExerciseSets(exerciseId: string): Promise<ExerciseSet[]> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('exercise_sets')
    .select('*')
    .eq('exercise_id', exerciseId)
    .order('set_number', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function updateExerciseSet(
  setId: string,
  setData: UpdateExerciseSetData,
): Promise<ExerciseSet> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('exercise_sets')
    .update(setData)
    .eq('id', setId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Recalculate exercise aggregates after updating a set
  await recalculateExerciseAggregates(supabase, data.exercise_id);

  return data;
}

export async function deleteExerciseSet(setId: string): Promise<void> {
  const supabase = getClient();

  // Get the exercise_id before deleting the set
  const { data: setData, error: fetchError } = await supabase
    .from('exercise_sets')
    .select('exercise_id')
    .eq('id', setId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const { error } = await supabase.from('exercise_sets').delete().eq('id', setId);

  if (error) {
    throw error;
  }

  // Recalculate exercise aggregates after deleting a set
  if (setData) {
    await recalculateExerciseAggregates(supabase, setData.exercise_id);
  }
}

export async function updateSetCompletionStatus(
  setId: string,
  completed: boolean,
): Promise<ExerciseSet> {
  const supabase = getClient();

  const { data, error } = await supabase
    .from('exercise_sets')
    .update({ completed })
    .eq('id', setId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

// Helper function to recalculate exercise aggregate values when sets are modified
async function recalculateExerciseAggregates(
  supabase: SupabaseClient,
  exerciseId: string,
): Promise<void> {
  // Fetch all current sets for this exercise
  const { data: sets, error: setsError } = await supabase
    .from('exercise_sets')
    .select('*')
    .eq('exercise_id', exerciseId);

  if (setsError) {
    throw setsError;
  }

  if (!sets || sets.length === 0) {
    return;
  }

  // Calculate aggregate values
  const setsCount = sets.length;
  const totalReps = sets.reduce((sum: number, set: ExerciseSet) => sum + set.reps, 0);
  const maxWeight = sets.reduce(
    (max: number, set: ExerciseSet) => Math.max(max, set.weight || 0),
    0,
  );
  const totalDuration = sets.reduce(
    (sum: number, set: ExerciseSet) => sum + (set.duration || 0),
    0,
  );
  const totalTimeUnderTension = sets.reduce(
    (sum: number, set: ExerciseSet) => sum + (set.time_under_tension || 0),
    0,
  );
  const totalRestTime = sets.reduce(
    (sum: number, set: ExerciseSet) => sum + (set.rest_time || 0),
    0,
  );
  const avgRestTime = setsCount > 0 ? totalRestTime / setsCount : 0;
  const completedSets = sets.filter((set: ExerciseSet) => set.completed).length;

  // Update the exercise with recalculated values
  const { error: updateError } = await supabase
    .from('workout_exercises')
    .update({
      sets: setsCount,
      reps: totalReps,
      weight: maxWeight,
      time_under_tension: totalTimeUnderTension,
      exercise_duration: totalDuration,
      rest_time: avgRestTime,
      completed_sets: completedSets,
    })
    .eq('id', exerciseId);

  if (updateError) {
    throw updateError;
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
      exercise_sets (*),
      workouts!inner (
        address,
        created_at
      )
    `,
    )
    .eq('exercise_name', exerciseName)
    .eq('workouts.address', address.toLowerCase())
    .order('workouts(created_at)', { ascending: false })
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

  const progressByDate = (
    data as unknown as (ExerciseWithWorkout & { exercise_sets?: ExerciseSet[] })[]
  ).reduce(
    (
      acc: ProgressAccumulator,
      exercise: ExerciseWithWorkout & { exercise_sets?: ExerciseSet[] },
    ) => {
      const date = exercise.workouts.created_at.split('T')[0];
      const sets = typeof exercise.sets === 'number' && exercise.sets > 0 ? exercise.sets : 0;
      const reps = typeof exercise.reps === 'number' && exercise.reps > 0 ? exercise.reps : 0;

      // Calculate max weight from individual sets if available, otherwise use legacy weight field
      let maxWeight = 0;
      if (exercise.exercise_sets && exercise.exercise_sets.length > 0) {
        // Find the maximum weight from all individual sets
        maxWeight = exercise.exercise_sets.reduce((max: number, set: ExerciseSet) => {
          return Math.max(max, set.weight || 0);
        }, 0);
      } else {
        // Fall back to legacy weight field for backwards compatibility
        maxWeight =
          typeof exercise.weight === 'number' && exercise.weight > 0 ? exercise.weight : 0;
      }

      // Calculate volume from individual sets if available, otherwise use legacy calculation
      let volume = 0;
      if (exercise.exercise_sets && exercise.exercise_sets.length > 0) {
        // Sum volume from each individual set (reps * weight per set)
        volume = exercise.exercise_sets.reduce((sum: number, set: ExerciseSet) => {
          return sum + set.reps * set.weight;
        }, 0);
      } else {
        // Fall back to legacy calculation for backwards compatibility
        volume = sets * reps * maxWeight;
      }

      if (!acc[date]) {
        acc[date] = {
          date,
          maxWeight: maxWeight,
          totalVolume: volume,
          totalSets: sets,
          totalReps: sets * reps,
        };
      } else {
        acc[date].maxWeight = Math.max(acc[date].maxWeight, maxWeight);
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
