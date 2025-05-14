import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { getProfile, IProfile, updateProfile as updateProfileDB } from '@/lib/supabase/profile';

interface ProfileState {
  profile: IProfile | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  lastUpdated: number | null;
}

// Initial state
const initialState: ProfileState = {
  profile: null,
  isLoading: false,
  isUpdating: false,
  error: null,
  lastUpdated: null,
};

// Async thunks
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (address: string, { rejectWithValue }) => {
    try {
      const profile = await getProfile({ address });
      return profile;
    } catch (error) {
      return rejectWithValue('Failed to fetch profile data. Please try again.');
    }
  },
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (
    { address, profileData }: { address: string; profileData: Partial<IProfile> },
    { rejectWithValue },
  ) => {
    try {
      // Update the profile in the database
      const profile = await updateProfileDB({ address, profileData });
      return profile;
    } catch (error) {
      return rejectWithValue('Failed to update profile. Please try again.');
    }
  },
);

// Create slice
const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfileError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch profile
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<IProfile | null>) => {
        state.isLoading = false;
        state.profile = action.payload || null;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<IProfile>) => {
        state.isUpdating = false;
        if (state.profile) {
          state.profile = {
            ...state.profile,
            ...action.payload,
            updated_at: new Date().toISOString(),
          };
        }
        state.lastUpdated = Date.now();
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
