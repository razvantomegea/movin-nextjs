import { getClient } from './createClient';

export interface Workout {
  id: string;
  user_address: string;
  name: string;
  total_volume: number;
  total_duration: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  is_completed: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  time_under_tension: number;
  exercise_duration: number;
  rest_time: number;
  notes?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  completed_sets: number;
}

export interface CreateWorkoutData {
  name: string;
  notes?: string;
}

export interface UpdateWorkoutData {
  name?: string;
  notes?: string;
  is_completed?: boolean;
  completed_at?: string;
}

export interface CreateExerciseData {
  workout_id: string;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  time_under_tension?: number;
  exercise_duration?: number;
  rest_time?: number;
  notes?: string;
  order_index?: number;
}

export interface UpdateExerciseData {
  exercise_name?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  time_under_tension?: number;
  exercise_duration?: number;
  rest_time?: number;
  notes?: string;
  order_index?: number;
  completed_sets?: number;
}

export interface WorkoutWithExercises extends Workout {
  workout_exercises: WorkoutExercise[];
}

// Workout CRUD operations
export async function createWorkout(userAddress: string, workoutData: CreateWorkoutData): Promise<Workout> {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_address: userAddress.toLowerCase(),
      ...workoutData,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getWorkouts(userAddress: string): Promise<Workout[]> {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_address', userAddress.toLowerCase())
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getWorkout(workoutId: string): Promise<Workout> {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getWorkoutWithExercises(workoutId: string): Promise<WorkoutWithExercises> {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      workout_exercises (*)
    `)
    .eq('id', workoutId)
    .single();

  if (error) {
    throw error;
  }

  // Sort exercises by order_index
  if (data.workout_exercises) {
    data.workout_exercises.sort((a: WorkoutExercise, b: WorkoutExercise) => a.order_index - b.order_index);
  }

  return data;
}

export async function updateWorkout(workoutId: string, workoutData: UpdateWorkoutData): Promise<Workout> {
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
  
  const { error } = await supabase
    .from('workouts')
    .delete()
    .eq('id', workoutId);

  if (error) {
    throw error;
  }
}

export async function completeWorkout(workoutId: string): Promise<Workout> {
  return updateWorkout(workoutId, {
    is_completed: true,
    completed_at: new Date().toISOString(),
  });
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
  
  const nextOrderIndex = maxOrderData && maxOrderData.length > 0 
    ? maxOrderData[0].order_index + 1 
    : 0;

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

export async function updateExercise(exerciseId: string, exerciseData: UpdateExerciseData): Promise<WorkoutExercise> {
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
  
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId);

  if (error) {
    throw error;
  }
}

export async function reorderExercises(workoutId: string, exerciseIds: string[]): Promise<void> {
  const supabase = getClient();
  
  // Update order_index for each exercise
  const updates = exerciseIds.map((exerciseId, index) => 
    supabase
      .from('workout_exercises')
      .update({ order_index: index })
      .eq('id', exerciseId)
      .eq('workout_id', workoutId)
  );

  await Promise.all(updates);
}

// Analytics functions
export async function getWorkoutStats(userAddress: string, startDate?: string, endDate?: string): Promise<{
  totalWorkouts: number;
  totalVolume: number;
  totalDuration: number;
  averageWorkoutDuration: number;
  completedWorkouts: number;
}> {
  const supabase = getClient();
  
  let query = supabase
    .from('workouts')
    .select('total_volume, total_duration, is_completed')
    .eq('user_address', userAddress.toLowerCase());

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

  const totalWorkouts = data.length;
  const totalVolume = data.reduce((sum: number, workout: any) => sum + (workout.total_volume || 0), 0);
  const totalDuration = data.reduce((sum: number, workout: any) => sum + (workout.total_duration || 0), 0);
  const completedWorkouts = data.filter((workout: any) => workout.is_completed).length;
  const averageWorkoutDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;

  return {
    totalWorkouts,
    totalVolume,
    totalDuration,
    averageWorkoutDuration,
    completedWorkouts,
  };
}

export async function getExerciseProgress(userAddress: string, exerciseName: string, limit = 10): Promise<{
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalSets: number;
}[]> {
  const supabase = getClient();
  
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      *,
      workouts!inner (
        user_address,
        created_at,
        is_completed
      )
    `)
    .eq('exercise_name', exerciseName)
    .eq('workouts.user_address', userAddress.toLowerCase())
    .eq('workouts.is_completed', true)
    .order('workouts.created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  // Group by date and calculate metrics
  const progressByDate = data.reduce((acc: Record<string, any>, exercise: any) => {
    const date = exercise.workouts.created_at.split('T')[0];
    
    if (!acc[date]) {
      acc[date] = {
        date,
        maxWeight: exercise.weight,
        totalVolume: exercise.sets * exercise.reps * exercise.weight,
        totalSets: exercise.sets,
      };
    } else {
      acc[date].maxWeight = Math.max(acc[date].maxWeight, exercise.weight);
      acc[date].totalVolume += exercise.sets * exercise.reps * exercise.weight;
      acc[date].totalSets += exercise.sets;
    }
    
    return acc;
  }, {});

  return Object.values(progressByDate);
}