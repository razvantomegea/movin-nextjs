import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

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
  activityRewards: ActivityReward[];
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

// Sample data for simulation
const sampleActivityRewards = [
  { type: 'Steps', amount: 0.85, percentage: 48 },
  { type: 'Workouts', amount: 0.62, percentage: 35 },
  { type: 'Daily Goals', amount: 0.31, percentage: 17 },
];

const sampleChallenges = [
  {
    id: 1,
    title: 'Weekly Challenge',
    description: 'Complete 50,000 steps this week',
    reward: 0.5,
    progress: 32500,
    total: 50000,
  },
  {
    id: 2,
    title: 'Streak Bonus',
    description: 'Maintain activity for 7 consecutive days',
    reward: 0.3,
    progress: 6,
    total: 7,
  },
];

// Async thunk for fetching activity rewards data
export const fetchActivityRewards = createAsyncThunk(
  'activityRewards/fetchActivityRewards',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate random error (20% chance)
      if (Math.random() < 0.2) {
        throw new Error('Failed to load activity rewards data. Please try again.');
      }

      // Calculate total rewards
      const totalRewards = sampleActivityRewards.reduce((sum, reward) => sum + reward.amount, 0);

      // Return sample data
      return {
        totalRewards,
        weeklyRewards: totalRewards,
        activityRewards: sampleActivityRewards,
        challenges: sampleChallenges,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  },
);

// Async thunk for claiming activity rewards
export const claimActivityRewards = createAsyncThunk(
  'activityRewards/claimActivityRewards',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate random error (20% chance)
      if (Math.random() < 0.2) {
        throw new Error('Transaction failed: Unable to claim activity rewards at this time');
      }

      // Return success
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  },
);

// Create the slice
const activityRewardsSlice = createSlice({
  name: 'activityRewards',
  initialState,
  reducers: {
    resetActivityRewardsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchActivityRewards
      .addCase(fetchActivityRewards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchActivityRewards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.totalRewards = action.payload.totalRewards;
        state.weeklyRewards = action.payload.weeklyRewards;
        state.activityRewards = action.payload.activityRewards;
        state.challenges = action.payload.challenges;
      })
      .addCase(fetchActivityRewards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load activity rewards data';
      })

      // Handle claimActivityRewards
      .addCase(claimActivityRewards.pending, (state) => {
        state.isClaiming = true;
        state.error = null;
      })
      .addCase(claimActivityRewards.fulfilled, (state) => {
        state.isClaiming = false;
        state.totalRewards = 0;
        state.weeklyRewards = 0;
        state.activityRewards = state.activityRewards.map((reward) => ({
          ...reward,
          amount: 0,
        }));
      })
      .addCase(claimActivityRewards.rejected, (state, action) => {
        state.isClaiming = false;
        state.error = (action.payload as string) || 'Failed to claim rewards';
      });
  },
});

export const { resetActivityRewardsError } = activityRewardsSlice.actions;
export default activityRewardsSlice.reducer;
