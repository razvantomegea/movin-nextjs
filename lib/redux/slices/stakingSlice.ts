import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUserStakes, IStake } from '@/lib/supabase/stake';

// Define types for state

interface StakingState {
  history: IStake[];
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: StakingState = {
  history: [],
  isLoading: false,
  error: null,
};

/**
 * Async thunk for fetching staking history from Supabase
 */
export const fetchStakingData = createAsyncThunk(
  'staking/fetchStakingData',
  async (address: string, { rejectWithValue }) => {
    try {
      // Get staking data from Supabase
      const stakes = await getUserStakes({ address });

      return { history: stakes };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  },
);

/**
 * Async thunk for claiming staking rewards - this just updates Supabase
 * The actual blockchain transaction is handled by useMovinEarn hook
 */
export const claimStakingRewards = createAsyncThunk(
  'staking/claimStakingRewards',
  async ({ address }: { address: string; stakeId?: string }, { rejectWithValue }) => {
    try {
      // This is just a placeholder to update history
      // Real claiming happens in useMovinEarn hook

      // After claiming, refresh the history
      const stakes = await getUserStakes({ address });

      return { history: stakes };
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
        state.history = action.payload.history;
      })
      .addCase(fetchStakingData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load staking data';
      })

      // Handle claimStakingRewards
      .addCase(claimStakingRewards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(claimStakingRewards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.history = action.payload.history;
      })
      .addCase(claimStakingRewards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to claim rewards';
      });
  },
});

export const { resetStakingError } = stakingSlice.actions;
export default stakingSlice.reducer;
