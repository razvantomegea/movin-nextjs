import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Define types for our state
export interface ReferralUser {
  id: number;
  name: string;
  status: 'Active' | 'Pending' | 'Inactive';
  reward: number;
  date: string;
}

interface ReferralRewardsState {
  totalReferrals: number;
  totalRewards: number;
  referralCode: string;
  referrals: ReferralUser[];
  isLoading: boolean;
  isClaiming: boolean;
  isInviting: boolean;
  error: string | null;
}

// Initial state
const initialState: ReferralRewardsState = {
  totalReferrals: 0,
  totalRewards: 0,
  referralCode: '',
  referrals: [],
  isLoading: false,
  isClaiming: false,
  isInviting: false,
  error: null,
};

// Sample data for simulation
const sampleReferrals = [
  {
    id: 1,
    name: 'Alex S.',
    status: 'Active' as const,
    reward: 1.5,
    date: 'Apr 18, 2025',
  },
  {
    id: 2,
    name: 'Jamie T.',
    status: 'Active' as const,
    reward: 1.5,
    date: 'Apr 10, 2025',
  },
  {
    id: 3,
    name: 'Taylor M.',
    status: 'Active' as const,
    reward: 1.5,
    date: 'Mar 28, 2025',
  },
];

// Async thunk for fetching referral rewards data
export const fetchReferralRewards = createAsyncThunk(
  'referralRewards/fetchReferralRewards',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate random error (20% chance)
      if (Math.random() < 0.2) {
        throw new Error('Failed to load referral rewards data. Please try again.');
      }

      // Calculate total rewards
      const totalRewards = sampleReferrals.reduce((sum, referral) => sum + referral.reward, 0);

      // Return sample data
      return {
        totalReferrals: sampleReferrals.length,
        totalRewards,
        referralCode: 'MOVIN123',
        referrals: sampleReferrals,
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  },
);

// Async thunk for claiming referral rewards
export const claimReferralRewards = createAsyncThunk(
  'referralRewards/claimReferralRewards',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate random error (20% chance)
      if (Math.random() < 0.2) {
        throw new Error('Transaction failed: Unable to claim referral rewards at this time');
      }

      // Return success
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  },
);

// Async thunk for inviting friends
export const inviteFriend = createAsyncThunk(
  'referralRewards/inviteFriend',
  async (email: string, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate random error (20% chance)
      if (Math.random() < 0.2) {
        throw new Error('Failed to send invitation. Please try again.');
      }

      // Return success
      return { success: true, email };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  },
);

// Create the slice
const referralRewardsSlice = createSlice({
  name: 'referralRewards',
  initialState,
  reducers: {
    resetReferralRewardsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchReferralRewards
      .addCase(fetchReferralRewards.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchReferralRewards.fulfilled, (state, action) => {
        state.isLoading = false;
        state.totalReferrals = action.payload.totalReferrals;
        state.totalRewards = action.payload.totalRewards;
        state.referralCode = action.payload.referralCode;
        state.referrals = action.payload.referrals;
      })
      .addCase(fetchReferralRewards.rejected, (state, action) => {
        state.isLoading = false;
        state.error = (action.payload as string) || 'Failed to load referral rewards data';
      })

      // Handle claimReferralRewards
      .addCase(claimReferralRewards.pending, (state) => {
        state.isClaiming = true;
        state.error = null;
      })
      .addCase(claimReferralRewards.fulfilled, (state) => {
        state.isClaiming = false;
        state.totalRewards = 0;
        // Reset rewards for each referral
        state.referrals = state.referrals.map((referral) => ({
          ...referral,
          reward: 0,
        }));
      })
      .addCase(claimReferralRewards.rejected, (state, action) => {
        state.isClaiming = false;
        state.error = (action.payload as string) || 'Failed to claim rewards';
      })

      // Handle inviteFriend
      .addCase(inviteFriend.pending, (state) => {
        state.isInviting = true;
        state.error = null;
      })
      .addCase(inviteFriend.fulfilled, (state) => {
        state.isInviting = false;
      })
      .addCase(inviteFriend.rejected, (state, action) => {
        state.isInviting = false;
        state.error = (action.payload as string) || 'Failed to invite friend';
      });
  },
});

export const { resetReferralRewardsError } = referralRewardsSlice.actions;
export default referralRewardsSlice.reducer;
