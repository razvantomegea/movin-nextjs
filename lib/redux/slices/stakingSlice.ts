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

// Create the slice
const stakingSlice = createSlice({
  name: 'staking',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle fetchStakingData
      .addCase(fetchStakingData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchStakingData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.history = action.payload.history;
      })
      .addCase(fetchStakingData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load staking data';
      });
  },
});

export default stakingSlice.reducer;
