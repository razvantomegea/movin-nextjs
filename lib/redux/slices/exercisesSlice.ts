import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { 
  WorkoutExercise, 
  CreateExerciseData, 
  UpdateExerciseData
} from '@/lib/supabase/workouts';

// Import the functions
import * as workoutAPI from '@/lib/supabase/workouts';

interface ExerciseState {
  exercises: WorkoutExercise[];
  loading: boolean;
  error: string | null;
  currentExercise: WorkoutExercise | null;
  exerciseProgress: {
    [exerciseName: string]: {
      date: string;
      maxWeight: number;
      totalVolume: number;
      totalSets: number;
    }[];
  };
}

const initialState: ExerciseState = {
  exercises: [],
  loading: false,
  error: null,
  currentExercise: null,
  exerciseProgress: {},
};

// Async thunks
export const fetchExercises = createAsyncThunk(
  'exercises/fetchExercises',
  async (workoutId: string, { rejectWithValue }: any) => {
    try {
      return await workoutAPI.getExercises(workoutId);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const createExerciseAction = createAsyncThunk(
  'exercises/createExercise',
  async (exerciseData: CreateExerciseData, { rejectWithValue }: any) => {
    try {
      return await workoutAPI.createExercise(exerciseData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateExerciseAction = createAsyncThunk(
  'exercises/updateExercise',
  async ({ exerciseId, exerciseData }: { exerciseId: string; exerciseData: UpdateExerciseData }, { rejectWithValue }: any) => {
    try {
      return await workoutAPI.updateExercise(exerciseId, exerciseData);
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteExerciseAction = createAsyncThunk(
  'exercises/deleteExercise',
  async (exerciseId: string, { rejectWithValue }: any) => {
    try {
      await workoutAPI.deleteExercise(exerciseId);
      return exerciseId;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const reorderExercisesAction = createAsyncThunk(
  'exercises/reorderExercises',
  async ({ workoutId, exerciseIds }: { workoutId: string; exerciseIds: string[] }, { rejectWithValue }: any) => {
    try {
      await workoutAPI.reorderExercises(workoutId, exerciseIds);
      return exerciseIds;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchExerciseProgress = createAsyncThunk(
  'exercises/fetchProgress',
  async ({ userAddress, exerciseName, limit }: { userAddress: string; exerciseName: string; limit?: number }, { rejectWithValue }: any) => {
    try {
      const progress = await workoutAPI.getExerciseProgress(userAddress, exerciseName, limit);
      return { exerciseName, progress };
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

const exercisesSlice = createSlice({
  name: 'exercises',
  initialState,
  reducers: {
    clearExercises: (state) => {
      state.exercises = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    setCurrentExercise: (state, action: PayloadAction<WorkoutExercise | null>) => {
      state.currentExercise = action.payload;
    },
    updateExerciseInList: (state, action: PayloadAction<WorkoutExercise>) => {
      const index = state.exercises.findIndex(exercise => exercise.id === action.payload.id);
      if (index !== -1) {
        state.exercises[index] = action.payload;
      }
    },
    reorderExercisesLocal: (state, action: PayloadAction<string[]>) => {
      const reorderedExercises = action.payload.map((id, index) => {
        const exercise = state.exercises.find(ex => ex.id === id);
        return exercise ? { ...exercise, order_index: index } : null;
      }).filter(Boolean) as WorkoutExercise[];
      
      state.exercises = reorderedExercises;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch exercises
      .addCase(fetchExercises.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExercises.fulfilled, (state, action) => {
        state.loading = false;
        state.exercises = action.payload;
      })
      .addCase(fetchExercises.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create exercise
      .addCase(createExerciseAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createExerciseAction.fulfilled, (state, action) => {
        state.loading = false;
        state.exercises.push(action.payload);
      })
      .addCase(createExerciseAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Update exercise
      .addCase(updateExerciseAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateExerciseAction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.exercises.findIndex(exercise => exercise.id === action.payload.id);
        if (index !== -1) {
          state.exercises[index] = action.payload;
        }
        // Update current exercise if it's the same one
        if (state.currentExercise && state.currentExercise.id === action.payload.id) {
          state.currentExercise = action.payload;
        }
      })
      .addCase(updateExerciseAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Delete exercise
      .addCase(deleteExerciseAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteExerciseAction.fulfilled, (state, action) => {
        state.loading = false;
        state.exercises = state.exercises.filter(exercise => exercise.id !== action.payload);
        // Clear current exercise if it was deleted
        if (state.currentExercise && state.currentExercise.id === action.payload) {
          state.currentExercise = null;
        }
      })
      .addCase(deleteExerciseAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reorder exercises
      .addCase(reorderExercisesAction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(reorderExercisesAction.fulfilled, (state, action) => {
        state.loading = false;
        // Reorder exercises based on the new order
        const reorderedExercises = action.payload.map((id, index) => {
          const exercise = state.exercises.find(ex => ex.id === id);
          return exercise ? { ...exercise, order_index: index } : null;
        }).filter(Boolean) as WorkoutExercise[];
        
        state.exercises = reorderedExercises;
      })
      .addCase(reorderExercisesAction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch exercise progress
      .addCase(fetchExerciseProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExerciseProgress.fulfilled, (state, action) => {
        state.loading = false;
        const { exerciseName, progress } = action.payload;
        state.exerciseProgress[exerciseName] = progress;
      })
      .addCase(fetchExerciseProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearExercises, 
  clearError, 
  setCurrentExercise, 
  updateExerciseInList, 
  reorderExercisesLocal 
} = exercisesSlice.actions;

export default exercisesSlice.reducer;