import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getUserStakes, IStake, updateStake, insertStakes } from '@/lib/supabase/stake';

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
 * Async thunk for updating stake in Supabase
 */
export const updateStakeData = createAsyncThunk(
  'staking/updateStakeData',
  async (stakeData: Partial<IStake>, { rejectWithValue }) => {
    try {
      const updated = await updateStake({ stakeData });
      return updated;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update stake');
    }
  },
);

/**
 * Async thunk for inserting multiple stakes in Supabase
 */
export const insertStakesData = createAsyncThunk(
  'staking/insertStakesData',
  async (stakeData: Partial<IStake>[], { rejectWithValue }) => {
    try {
      const inserted = await insertStakes({ stakeData });
      return inserted;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to insert stakes');
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
      })

      // Handle updateStakeData
      .addCase(updateStakeData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateStakeData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Update the stake in the history array
        const updatedIndex = state.history.findIndex((stake) => stake.id === action.payload.id);
        if (updatedIndex !== -1) {
          state.history[updatedIndex] = action.payload;
        }
      })
      .addCase(updateStakeData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to update stake';
      })

      // Handle insertStakesData
      .addCase(insertStakesData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(insertStakesData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Add new stakes to history
        state.history = [...state.history, ...action.payload];
      })
      .addCase(insertStakesData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to insert stakes';
      });
  },
});

export default stakingSlice.reducer;
