import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/nextjs';
import { addEnergyEntry } from '@/lib/redux/slices/energyDataSlice';
import { IActivity, insertActivities, updateActivity } from '@/lib/supabase/activities';

export interface FailedSave {
  id: string;
  type: 'add' | 'update';
  dataType: 'activity' | 'meal';
  address: string;
  activityData?: Partial<IActivity> | Partial<IActivity>[];
  mealData?: {
    address: string;
    meal_name: string;
    calories: number;
    protein: number;
    carbohydrates: number;
    fats: number;
    fiber: number;
    log_date: string;
  };
  timestamp: number;
  retryCount: number;
  error: string;
}

interface FailedSavesState {
  failedSaves: FailedSave[];
  isRetrying: boolean;
  error: string | null;
}

const initialState: FailedSavesState = {
  failedSaves: [],
  isRetrying: false,
  error: null,
};

// Load failed saves from localStorage on app start
const loadFailedSaves = (): FailedSave[] => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = localStorage.getItem('movin-failed-saves');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load failed saves from localStorage:', error);
    return [];
  }
};

// Save failed saves to localStorage
const saveFailedSaves = (failedSaves: FailedSave[]) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('movin-failed-saves', JSON.stringify(failedSaves));
  } catch (error) {
    console.error('Failed to save failed saves to localStorage:', error);
  }
};

// Retry a failed save
export const retryFailedSave = createAsyncThunk(
  'failedSaves/retryFailedSave',
  async (failedSave: FailedSave, { dispatch, rejectWithValue }) => {
    try {
      let result;

      if (failedSave.dataType === 'activity') {
        if (failedSave.type === 'add' && failedSave.activityData) {
          const activityData = Array.isArray(failedSave.activityData)
            ? failedSave.activityData
            : [failedSave.activityData];

          // Ensure address is set on all activities
          const dataWithAddress = activityData.map((a) => ({ ...a, address: failedSave.address }));
          result = await insertActivities({ activityData: dataWithAddress });
        } else if (failedSave.type === 'update' && failedSave.activityData) {
          if (Array.isArray(failedSave.activityData)) {
            throw new Error('Update operation cannot handle multiple activities');
          }
          result = await updateActivity({ activityData: failedSave.activityData });
        }
      } else if (failedSave.dataType === 'meal' && failedSave.mealData) {
        if (failedSave.type === 'add') {
          result = await dispatch(
            addEnergyEntry({
              address: failedSave.address,
              energyData: failedSave.mealData,
            }),
          ).unwrap();
        }
      }

      return { failedSaveId: failedSave.id, result };
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue({
        failedSaveId: failedSave.id,
        error: error instanceof Error ? error.message : 'Failed to retry save',
      });
    }
  },
);

// Retry all failed saves
export const retryAllFailedSaves = createAsyncThunk(
  'failedSaves/retryAllFailedSaves',
  async (_, { getState, dispatch }) => {
    const state = getState() as { failedSaves: FailedSavesState };
    const failedSaves = state.failedSaves.failedSaves;

    const results = [];
    for (const failedSave of failedSaves) {
      try {
        const result = await dispatch(retryFailedSave(failedSave)).unwrap();
        results.push({ success: true, id: failedSave.id, result });
      } catch (error) {
        results.push({ success: false, id: failedSave.id, error });
      }
    }

    return results;
  },
);

const failedSavesSlice = createSlice({
  name: 'failedSaves',
  initialState: {
    ...initialState,
    failedSaves: loadFailedSaves(),
  },
  reducers: {
    addFailedSave: (
      state,
      action: PayloadAction<Omit<FailedSave, 'id' | 'timestamp' | 'retryCount'>>,
    ) => {
      const failedSave: FailedSave = {
        ...action.payload,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        retryCount: 0,
      };

      state.failedSaves.push(failedSave);
      saveFailedSaves(state.failedSaves);
    },

    removeFailedSave: (state, action: PayloadAction<string>) => {
      state.failedSaves = state.failedSaves.filter((save) => save.id !== action.payload);
      saveFailedSaves(state.failedSaves);
    },

    clearAllFailedSaves: (state) => {
      state.failedSaves = [];
      saveFailedSaves(state.failedSaves);
    },

    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const failedSave = state.failedSaves.find((save) => save.id === action.payload);
      if (failedSave) {
        failedSave.retryCount += 1;
        saveFailedSaves(state.failedSaves);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(retryFailedSave.pending, (state) => {
        state.isRetrying = true;
        state.error = null;
      })
      .addCase(retryFailedSave.fulfilled, (state, action) => {
        state.isRetrying = false;
        // Remove the successfully retried save
        state.failedSaves = state.failedSaves.filter(
          (save) => save.id !== action.payload.failedSaveId,
        );
        saveFailedSaves(state.failedSaves);
      })
      .addCase(retryFailedSave.rejected, (state, action) => {
        state.isRetrying = false;
        if (
          action.payload &&
          typeof action.payload === 'object' &&
          'failedSaveId' in action.payload
        ) {
          const { failedSaveId, error } = action.payload as { failedSaveId: string; error: string };

          // Increment retry count and update error
          const failedSave = state.failedSaves.find((save) => save.id === failedSaveId);
          if (failedSave) {
            failedSave.retryCount += 1;
            failedSave.error = error;

            // Remove if retry count exceeds maximum (e.g., 5 attempts)
            if (failedSave.retryCount >= 5) {
              state.failedSaves = state.failedSaves.filter((save) => save.id !== failedSaveId);
            }

            saveFailedSaves(state.failedSaves);
          }
          state.error = error;
        }
      })

      .addCase(retryAllFailedSaves.pending, (state) => {
        state.isRetrying = true;
        state.error = null;
      })
      .addCase(retryAllFailedSaves.fulfilled, (state, action) => {
        state.isRetrying = false;

        // Remove successful retries and update failed ones
        const successfulIds = action.payload
          .filter((result) => result.success)
          .map((result) => result.id);

        state.failedSaves = state.failedSaves.filter((save) => !successfulIds.includes(save.id));

        // Update retry counts for failed attempts
        const failedRetries = action.payload.filter((result) => !result.success);
        failedRetries.forEach((retry) => {
          const failedSave = state.failedSaves.find((save) => save.id === retry.id);
          if (failedSave) {
            failedSave.retryCount += 1;
            if (failedSave.retryCount >= 5) {
              state.failedSaves = state.failedSaves.filter((save) => save.id !== retry.id);
            }
          }
        });

        saveFailedSaves(state.failedSaves);
      })
      .addCase(retryAllFailedSaves.rejected, (state, action) => {
        state.isRetrying = false;
        state.error = action.error.message || 'Failed to retry saves';
      });
  },
});

export const { addFailedSave, removeFailedSave, clearAllFailedSaves, incrementRetryCount } =
  failedSavesSlice.actions;

export default failedSavesSlice.reducer;
