export interface Workout {
  id: string;
  user_address: string;
  name: string;
  total_volume: number;
  total_duration: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
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
  exercise_sets?: ExerciseSet[];
}

// Individual set data structure - now matches the exercise_sets table
export interface ExerciseSet {
  id: string;
  exercise_id: string;
  address: string;
  set_number: number;
  reps: number;
  weight: number;
  duration: number;
  time_under_tension: number;
  rest_time: number;
  completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Database insert/update types for exercise_sets
export interface CreateExerciseSetData {
  exercise_id: string;
  address: string;
  set_number: number;
  reps: number;
  weight: number;
  duration?: number;
  time_under_tension?: number;
  rest_time?: number;
  completed?: boolean;
  notes?: string;
}

export interface UpdateExerciseSetData {
  reps?: number;
  weight?: number;
  duration?: number;
  time_under_tension?: number;
  rest_time?: number;
  completed?: boolean;
  notes?: string;
}

export interface CreateWorkoutData {
  name: string;
  notes?: string;
}

export interface UpdateWorkoutData {
  name?: string;
  notes?: string;
}

export interface CreateExerciseData {
  address: string;
  workout_id: string;
  exercise_name: string;
  notes?: string;
  order_index?: number;
  exercise_sets?: CreateExerciseSetData[];
}

export interface UpdateExerciseData {
  address: string;
  exercise_name?: string;
  notes?: string;
  order_index?: number;
  exercise_sets?: CreateExerciseSetData[];
  completed_sets?: number;
}

export interface WorkoutWithExercises extends Workout {
  workout_exercises: WorkoutExercise[];
}

export interface WorkoutStatsRow {
  total_volume: number;
  total_duration: number;
}

export type ProgressByDate = Record<
  string,
  {
    date: string;
    maxWeight: number;
    totalVolume: number;
    totalSets: number;
    totalReps: number;
    totalTimeUnderTension: number;
  }
>;

export type ExerciseWithWorkout = WorkoutExercise & {
  workouts: {
    created_at: string;
    user_address: string;
  };
};

export type ExerciseProgress = {
  date: string;
  maxWeight: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  totalTimeUnderTension: number;
};

// Helper type for UI purposes - temporary set data that doesn't have database IDs yet
export interface TempExerciseSet {
  id?: string; // Optional for new sets
  reps: number;
  weight: number;
  duration: number;
  time_under_tension: number;
  rest_time: number;
  completed: boolean;
  notes?: string;
}
