import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  reorderExercises,
  getExerciseProgress,
} from '@/lib/supabase/workouts';
import type {
  WorkoutExercise,
  CreateExerciseData,
  UpdateExerciseData,
  ExerciseProgress,
} from '@/types/workouts';

interface ExerciseState {
  exercises: WorkoutExercise[];
  loading: boolean;
  error: string | null;
  currentExercise: WorkoutExercise | null;
  exerciseProgress: {
    [workoutId: string]: {
      [exerciseName: string]: {
        date: string;
        maxWeight: number;
        totalVolume: number;
        totalSets: number;
      }[];
    };
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
export const fetchExercises = createAsyncThunk<WorkoutExercise[], string, { rejectValue: string }>(
  'exercises/fetchExercises',
  async (workoutId, { rejectWithValue }) => {
    try {
      return await getExercises(workoutId);
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const createExerciseAction = createAsyncThunk<
  WorkoutExercise,
  CreateExerciseData,
  { rejectValue: string }
>('exercises/createExercise', async (exerciseData, { rejectWithValue }) => {
  try {
    return await createExercise(exerciseData);
  } catch (error: unknown) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export const updateExerciseAction = createAsyncThunk<
  WorkoutExercise,
  { exerciseId: string; exerciseData: UpdateExerciseData },
  { rejectValue: string }
>('exercises/updateExercise', async ({ exerciseId, exerciseData }, { rejectWithValue }) => {
  try {
    return await updateExercise(exerciseId, exerciseData);
  } catch (error: unknown) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export const deleteExerciseAction = createAsyncThunk<string, string, { rejectValue: string }>(
  'exercises/deleteExercise',
  async (exerciseId, { rejectWithValue }) => {
    try {
      await deleteExercise(exerciseId);
      return exerciseId;
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
);

export const reorderExercisesAction = createAsyncThunk<
  string[],
  { workoutId: string; exerciseIds: string[] },
  { rejectValue: string }
>('exercises/reorderExercises', async ({ workoutId, exerciseIds }, { rejectWithValue }) => {
  try {
    await reorderExercises(workoutId, exerciseIds);
    return exerciseIds;
  } catch (error: unknown) {
    return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
  }
});

export const fetchExerciseProgress = createAsyncThunk<
  { workoutId: string; exerciseName: string; progress: ExerciseProgress[] },
  { userAddress: string; workoutId: string; exerciseName: string; limit?: number },
  { rejectValue: string }
>(
  'exercises/fetchProgress',
  async ({ userAddress, workoutId, exerciseName, limit }, { rejectWithValue }) => {
    try {
      const progress = await getExerciseProgress(userAddress, exerciseName, limit);
      return { workoutId, exerciseName, progress };
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  },
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
      const index = state.exercises.findIndex((exercise) => exercise.id === action.payload.id);
      if (index !== -1) {
        state.exercises[index] = action.payload;
      }
    },
    reorderExercisesLocal: (state, action: PayloadAction<string[]>) => {
      // Validate all IDs exist
      const missingIds = action.payload.filter((id) => !state.exercises.some((ex) => ex.id === id));
      if (missingIds.length > 0) {
        state.error = `Invalid exercise IDs: ${missingIds.join(', ')}`;
        return;
      }
      const reorderedExercises = action.payload.map((id, index) => {
        const exercise = state.exercises.find((ex) => ex.id === id);
        return { ...exercise!, order_index: index };
      });
      state.exercises = reorderedExercises;
    },
    clearExerciseProgress: (
      state,
      action: PayloadAction<{ workoutId: string; exerciseName: string }>,
    ) => {
      const { workoutId, exerciseName } = action.payload;
      if (state.exerciseProgress[workoutId] && state.exerciseProgress[workoutId][exerciseName]) {
        delete state.exerciseProgress[workoutId][exerciseName];
      }
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
        const index = state.exercises.findIndex((exercise) => exercise.id === action.payload.id);
        if (index !== -1) {
          state.exercises[index] = action.payload;
        }
        // Update current exercise if it's the same one
        if (state.currentExercise && state.currentExercise.id === action.payload.id) {
          state.currentExercise = action.payload;
        }
        // Clear exercise progress to force refresh
        const updatedExercise = action.payload;
        Object.keys(state.exerciseProgress).forEach((workoutId) => {
          if (state.exerciseProgress[workoutId][updatedExercise.exercise_name]) {
            delete state.exerciseProgress[workoutId][updatedExercise.exercise_name];
          }
        });
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
        state.exercises = state.exercises.filter((exercise) => exercise.id !== action.payload);
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
        // Validate all IDs exist
        const missingIds = action.payload.filter(
          (id: string) => !state.exercises.some((ex) => ex.id === id),
        );
        if (missingIds.length > 0) {
          state.error = `Invalid exercise IDs: ${missingIds.join(', ')}`;
          return;
        }
        // Reorder exercises based on the new order
        const reorderedExercises = action.payload.map((id: string, index: number) => {
          const exercise = state.exercises.find((ex) => ex.id === id);
          return { ...exercise!, order_index: index };
        });
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
        const { workoutId, exerciseName, progress } = action.payload;
        if (!state.exerciseProgress[workoutId]) {
          state.exerciseProgress[workoutId] = {};
        }
        state.exerciseProgress[workoutId][exerciseName] = progress;
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
  reorderExercisesLocal,
  clearExerciseProgress,
} = exercisesSlice.actions;

export default exercisesSlice.reducer;
