import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  insertActivityReward,
  IActivityReward,
  getUserActivityRewards,
} from '@/lib/supabase/activityRewards';

// Define types for our state
export interface ActivityReward {
  type: string;
  amount: number;
  percentage: number;
}

export interface Challenge {
  id: number;
  title: string;
  description: string;
  reward: number;
  progress: number;
  total: number;
}

export interface ActivityRewardsState {
  totalRewards: number;
  weeklyRewards: number;
  activityRewards: IActivityReward[];
  challenges: Challenge[];
  isLoading: boolean;
  isClaiming: boolean;
  error: string | null;
}

// Initial state
const initialState: ActivityRewardsState = {
  totalRewards: 0,
  weeklyRewards: 0,
  activityRewards: [],
  challenges: [],
  isLoading: false,
  isClaiming: false,
  error: null,
};

// Fetch activity rewards history from Supabase
export const fetchActivityRewards = createAsyncThunk(
  'activityRewards/fetchActivityRewards',
  async (address: string, { rejectWithValue }) => {
    try {
      const history = await getUserActivityRewards({ address });
      return history;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch activity rewards history',
      );
    }
  },
);

// Record a new activity reward in Supabase
export const recordActivityReward = createAsyncThunk(
  'activityRewards/recordActivityReward',
  async ({ address, rewards }: { address: string; rewards: number }, { rejectWithValue }) => {
    try {
      const newReward = await insertActivityReward({
        rewardData: {
          address,
          rewards,
        },
      });
      return newReward;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to record activity reward',
      );
    }
  },
);

// Create the slice
const activityRewardsSlice = createSlice({
  name: 'activityRewards',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetchActivityRewards
      .addCase(fetchActivityRewards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivityRewards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activityRewards = action.payload;
      })
      .addCase(fetchActivityRewards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load activity rewards data';
      })

      // Handle fetchActivityRewardsHistory
      .addCase(fetchActivityRewards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivityRewards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activityRewards = action.payload;
        state.error = null;
      })
      .addCase(recordActivityReward.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(recordActivityReward.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activityRewards = [action.payload, ...state.activityRewards];
      })
      .addCase(recordActivityReward.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to record activity reward';
      });
  },
});

export default activityRewardsSlice.reducer;
