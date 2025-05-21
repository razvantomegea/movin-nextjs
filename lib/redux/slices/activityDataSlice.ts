import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { IActivity, getActivities, insertActivities } from '@/lib/supabase/activities';

interface ActivityDataState {
  activities: IActivity[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: ActivityDataState = {
  activities: [],
  isLoading: false,
  error: null,
};

export const fetchActivities = createAsyncThunk(
  'activityData/fetchActivities',
  async (address: string, { rejectWithValue }) => {
    try {
      const activities = await getActivities({ address });
      return activities;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch activities');
    }
  },
);

export const addActivities = createAsyncThunk(
  'activityData/addActivities',
  async (
    { address, activityData }: { address: string; activityData: Partial<IActivity>[] },
    { rejectWithValue },
  ) => {
    try {
      // Ensure address is set on all activities
      const dataWithAddress = activityData.map((a) => ({ ...a, address }));
      const newActivities = await insertActivities({ activityData: dataWithAddress });
      return newActivities;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add activities');
    }
  },
);

// Create the slice
const activityDataSlice = createSlice({
  name: 'activityData',
  initialState,
  reducers: {
    resetActivityError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activities = action.payload;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to fetch activities';
      })
      // Handle addActivities
      .addCase(addActivities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        const existingIds = new Set(state.activities.map((a) => a.id));
        const uniqueNewActivities = action.payload.filter((a) => !existingIds.has(a.id));
        state.activities = [...uniqueNewActivities, ...state.activities];
      })
      .addCase(addActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to add activities';
      });
  },
});

export const { resetActivityError } = activityDataSlice.actions;
export default activityDataSlice.reducer;
