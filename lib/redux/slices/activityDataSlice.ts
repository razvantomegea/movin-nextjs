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

export const fetchActivities = createAsyncThunk<
  IActivity[], // Return type
  string, // Argument (address)
  { rejectValue: string } // ThunkApiConfig
>('activityData/fetchActivities', async (address, { rejectWithValue }) => {
  try {
    const activities = await getActivities({ address });
    return activities;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch activities');
  }
});

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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
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
        state.error = null;
        const initialMap = new Map(state.activities.map((a) => [a.id, a]));
        const merged = action.payload.reduce((acc, act) => {
          acc.set(act.id, act);
          return acc;
        }, initialMap);
        state.activities = Array.from(merged.values()).sort(
          (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime(),
        );
      })
      .addCase(addActivities.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to add activities';
      });
  },
});

export default activityDataSlice.reducer;
