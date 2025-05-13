import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Define types for our state
export interface Stake {
  id: number;
  amount: number;
  apr: number;
  startDate: string;
  endDate: string;
  period: number;
  rewards: number;
}

export interface StakingHistoryItem {
  type: string;
  amount: string;
  date: string;
}

interface StakingState {
  stakes: Stake[];
  totalStaked: number;
  totalRewards: number;
  availableMVN: number;
  history: StakingHistoryItem[];
  isLoading: boolean;
  isClaiming: boolean;
  isStaking: boolean;
  error: string | null;
}

// Initial state
const initialState: StakingState = {
  stakes: [],
  totalStaked: 0,
  totalRewards: 0,
  availableMVN: 150,
  history: [
    { type: 'Reward', amount: '+2.5 MVN', date: 'Apr 20, 2025' },
    { type: 'Stake', amount: '+50 MVN', date: 'Apr 15, 2025' },
    { type: 'Reward', amount: '+2.1 MVN', date: 'Apr 13, 2025' },
  ],
  isLoading: false,
  isClaiming: false,
  isStaking: false,
  error: null,
};

// Sample stake data for simulation
const sampleStakes = [
  {
    id: 1,
    amount: 100,
    apr: 8,
    startDate: '2025-04-01T00:00:00.000Z', // April 1, 2025
    endDate: '2025-08-01T00:00:00.000Z', // August 1, 2025
    period: 4, // 4 months
    rewards: 2.67,
  },
  {
    id: 2,
    amount: 75,
    apr: 12,
    startDate: '2025-03-15T00:00:00.000Z', // March 15, 2025
    endDate: '2026-03-15T00:00:00.000Z', // March 15, 2026
    period: 12, // 12 months
    rewards: 9.0,
  },
  {
    id: 3,
    amount: 50,
    apr: 6,
    startDate: '2025-04-10T00:00:00.000Z', // April 10, 2025
    endDate: '2025-05-10T00:00:00.000Z', // May 10, 2025
    period: 1, // 1 month
    rewards: 0.25,
  },
];

// Async thunk for fetching staking data
export const fetchStakingData = createAsyncThunk(
  'staking/fetchStakingData',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate random error (20% chance)
      if (Math.random() < 0.2) {
        throw new Error('Failed to load staking data. Please try again.');
      }

      // Return sample data
      return {
        stakes: sampleStakes,
        totalStaked: sampleStakes.reduce((sum, stake) => sum + stake.amount, 0),
        totalRewards: sampleStakes.reduce((sum, stake) => sum + stake.rewards, 0),
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  },
);

// Async thunk for claiming staking rewards
export const claimStakingRewards = createAsyncThunk(
  'staking/claimStakingRewards',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate random error (20% chance)
      if (Math.random() < 0.2) {
        throw new Error('Transaction failed: Unable to claim rewards at this time');
      }

      // Return success
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  },
);

// Async thunk for staking MVN
export const stakeMVN = createAsyncThunk(
  'staking/stakeMVN',
  async ({ amount, period }: { amount: number; period: number }, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate random error (20% chance)
      if (Math.random() < 0.2) {
        throw new Error('Network error: Unable to complete staking transaction');
      }

      // Calculate APR based on period (base 5% + period bonus)
      const apr = 5 + period;

      // Calculate rewards
      const rewards = (amount * apr * period) / (12 * 100);

      // Create new stake
      const newStake: Stake = {
        id: Date.now(),
        amount,
        apr,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + period * 30 * 24 * 60 * 60 * 1000).toISOString(),
        period,
        rewards,
      };

      return newStake;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  },
);

// Create the slice
const stakingSlice = createSlice({
  name: 'staking',
  initialState,
  reducers: {
    resetStakingError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchStakingData
      .addCase(fetchStakingData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStakingData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stakes = action.payload.stakes;
        state.totalStaked = action.payload.totalStaked;
        state.totalRewards = action.payload.totalRewards;
      })
      .addCase(fetchStakingData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load staking data';
      })

      // Handle claimStakingRewards
      .addCase(claimStakingRewards.pending, (state) => {
        state.isClaiming = true;
        state.error = null;
      })
      .addCase(claimStakingRewards.fulfilled, (state) => {
        state.isClaiming = false;
        // Add to history
        state.history.unshift({
          type: 'Reward',
          amount: `+${state.totalRewards.toFixed(2)} MVN`,
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        });
        // Reset rewards
        state.totalRewards = 0;
      })
      .addCase(claimStakingRewards.rejected, (state, action) => {
        state.isClaiming = false;
        state.error = (action.payload as string) || 'Failed to claim rewards';
      })

      // Handle stakeMVN
      .addCase(stakeMVN.pending, (state) => {
        state.isStaking = true;
        state.error = null;
      })
      .addCase(stakeMVN.fulfilled, (state, action) => {
        state.isStaking = false;
        // Add new stake
        state.stakes.push(action.payload);
        // Update total staked
        state.totalStaked += action.payload.amount;
        // Update available MVN
        state.availableMVN -= action.payload.amount;
        // Add to history
        state.history.unshift({
          type: 'Stake',
          amount: `+${action.payload.amount} MVN`,
          date: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        });
      })
      .addCase(stakeMVN.rejected, (state, action) => {
        state.isStaking = false;
        state.error = (action.payload as string) || 'Failed to stake MVN';
      });
  },
});

export const { resetStakingError } = stakingSlice.actions;
export default stakingSlice.reducer;
