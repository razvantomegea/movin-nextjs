import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Workout,
  WorkoutWithExercises,
  CreateWorkoutData,
  UpdateWorkoutData,
  getWorkouts,
  getWorkout,
  getWorkoutWithExercises,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  completeWorkout,
  getWorkoutStats,
} from '@/lib/supabase/workouts';

interface WorkoutState {
  workouts: Workout[];
  currentWorkout: WorkoutWithExercises | null;
  loading: boolean;
  error: string | null;
  stats: {
    totalWorkouts: number;
    totalVolume: number;
    totalDuration: number;
    averageWorkoutDuration: number;
    completedWorkouts: number;
  } | null;
}

const initialState: WorkoutState = {
  workouts: [],
  currentWorkout: null,
  loading: false,
  error: null,
  stats: null,
};

// Async thunks
export const fetchWorkouts = createAsyncThunk(
  'workouts/fetchWorkouts',
  async (userAddress: string, { rejectWithValue }) => {
    try {
      return await getWorkouts(userAddress);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchWorkout = createAsyncThunk(
  'workouts/fetchWorkout',
  async (workoutId: string, { rejectWithValue }) => {
    try {
      return await getWorkout(workoutId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchWorkoutWithExercises = createAsyncThunk(
  'workouts/fetchWorkoutWithExercises',
  async (workoutId: string, { rejectWithValue }) => {
    try {
      return await getWorkoutWithExercises(workoutId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const createWorkoutAction = createAsyncThunk(
  'workouts/createWorkout',
  async (
    { userAddress, workoutData }: { userAddress: string; workoutData: CreateWorkoutData },
    { rejectWithValue },
  ) => {
    try {
      return await createWorkout(userAddress, workoutData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const updateWorkoutAction = createAsyncThunk(
  'workouts/updateWorkout',
  async (
    { workoutId, workoutData }: { workoutId: string; workoutData: UpdateWorkoutData },
    { rejectWithValue },
  ) => {
    try {
      return await updateWorkout(workoutId, workoutData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const deleteWorkoutAction = createAsyncThunk(
  'workouts/deleteWorkout',
  async (workoutId: string, { rejectWithValue }) => {
    try {
      await deleteWorkout(workoutId);
      return workoutId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const completeWorkoutAction = createAsyncThunk(
  'workouts/completeWorkout',
  async (workoutId: string, { rejectWithValue }) => {
    try {
      return await completeWorkout(workoutId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchWorkoutStats = createAsyncThunk(
  'workouts/fetchStats',
  async (
    {
      userAddress,
      startDate,
      endDate,
    }: { userAddress: string; startDate?: string; endDate?: string },
    { rejectWithValue },
  ) => {
    try {
      return await getWorkoutStats(userAddress, startDate, endDate);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

const workoutsSlice = createSlice({
  name: 'workouts',
  initialState,
  reducers: {
    clearCurrentWorkout: (state) => {
      state.currentWorkout = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateWorkoutInList: (state, action: PayloadAction<Workout>) => {
      const index = state.workouts.findIndex((workout) => workout.id === action.payload.id);
      if (index !== -1) {
        state.workouts[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch workouts
      .addCase(fetchWorkouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkouts.fulfilled, (state, action) => {
        state.loading = false;
        state.workouts = action.payload;
      })
      .addCase(fetchWorkouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch single workout
      .addCase(fetchWorkout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkout.fulfilled, (state, action) => {
        state.loading = false;
        // Update the workout in the list if it exists
        const index = state.workouts.findIndex((workout) => workout.id === action.payload.id);
        if (index !== -1) {
          state.workouts[index] = action.payload;
        }
      })
      .addCase(fetchWorkout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch workout with exercises
      .addCase(fetchWorkoutWithExercises.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkoutWithExercises.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkout = action.payload;
      })
      .addCase(fetchWorkoutWithExercises.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create workout
      .addCase(createWorkoutAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWorkoutAction.fulfilled, (state, action) => {
        state.loading = false;
        state.workouts.unshift(action.payload);
      })
      .addCase(createWorkoutAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Update workout
      .addCase(updateWorkoutAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWorkoutAction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.workouts.findIndex((workout) => workout.id === action.payload.id);
        if (index !== -1) {
          state.workouts[index] = action.payload;
        }
        // Update current workout if it's the same one
        if (state.currentWorkout && state.currentWorkout.id === action.payload.id) {
          state.currentWorkout = { ...state.currentWorkout, ...action.payload };
        }
      })
      .addCase(updateWorkoutAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Delete workout
      .addCase(deleteWorkoutAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWorkoutAction.fulfilled, (state, action) => {
        state.loading = false;
        state.workouts = state.workouts.filter((workout) => workout.id !== action.payload);
        // Clear current workout if it was deleted
        if (state.currentWorkout && state.currentWorkout.id === action.payload) {
          state.currentWorkout = null;
        }
      })
      .addCase(deleteWorkoutAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Complete workout
      .addCase(completeWorkoutAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(completeWorkoutAction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.workouts.findIndex((workout) => workout.id === action.payload.id);
        if (index !== -1) {
          state.workouts[index] = action.payload;
        }
        // Update current workout if it's the same one
        if (state.currentWorkout && state.currentWorkout.id === action.payload.id) {
          state.currentWorkout = { ...state.currentWorkout, ...action.payload };
        }
      })
      .addCase(completeWorkoutAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch stats
      .addCase(fetchWorkoutStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkoutStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchWorkoutStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearCurrentWorkout, clearError, updateWorkoutInList } = workoutsSlice.actions;

export default workoutsSlice.reducer;
