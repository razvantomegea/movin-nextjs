import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

// Define types for profile data
export interface ProfileData {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  level: number;
  streak_days: number;
  mvn_tokens: number;
  created_at: string;
  updated_at: string;
}

interface ProfileState {
  profile: ProfileData | null;
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

// Mock data for development
const mockProfile: ProfileData = {
  id: 'user-123',
  username: 'JohnRunner',
  email: 'john@example.com',
  avatar_url: null,
  level: 5,
  streak_days: 7,
  mvn_tokens: 15.2,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Async thunks
export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // In a real app, this would be an API call to fetch profile data
      return mockProfile;
    } catch (error) {
      return rejectWithValue('Failed to fetch profile data. Please try again.');
    }
  },
);

export const updateProfile = createAsyncThunk(
  'profile/updateProfile',
  async (profileData: Partial<ProfileData>, { rejectWithValue }) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // In a real app, this would be an API call to update profile data
      return profileData;
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
      .addCase(fetchProfile.fulfilled, (state, action: PayloadAction<ProfileData>) => {
        state.isLoading = false;
        state.profile = action.payload;
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
      .addCase(updateProfile.fulfilled, (state, action: PayloadAction<Partial<ProfileData>>) => {
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
