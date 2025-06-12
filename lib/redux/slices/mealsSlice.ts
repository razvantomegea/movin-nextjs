import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/nextjs';
import { IMeal, getRecentMeals, insertMeal, searchMealsByName } from '@/lib/supabase/meals';

interface MealsState {
  recentMeals: IMeal[];
  searchResults: IMeal[];
  isLoading: boolean;
  error: string | null;
}

const initialState: MealsState = {
  recentMeals: [],
  searchResults: [],
  isLoading: false,
  error: null,
};

// Async thunk for fetching recent meals
export const fetchRecentMeals = createAsyncThunk(
  'meals/fetchRecentMeals',
  async (address: string, { rejectWithValue }) => {
    try {
      const meals = await getRecentMeals({ address });
      return meals;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch recent meals',
      );
    }
  },
);

// Async thunk for adding a meal
export const addMealToLibrary = createAsyncThunk(
  'meals/addMealToLibrary',
  async (
    { address, mealData }: { address: string; mealData: Partial<IMeal> },
    { rejectWithValue },
  ) => {
    try {
      if (!address) {
        throw new Error('Address is required to add meal to library');
      }
      const meal = await insertMeal({ address, mealData });
      return meal;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add meal to library',
      );
    }
  },
);

// Async thunk for searching meals
export const searchMeals = createAsyncThunk(
  'meals/searchMeals',
  async ({ address, searchTerm }: { address: string; searchTerm: string }, { rejectWithValue }) => {
    try {
      const meals = await searchMealsByName({ address, searchTerm });
      return meals;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search meals');
    }
  },
);

const mealsSlice = createSlice({
  name: 'meals',
  initialState,
  reducers: {
    resetMealsError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchRecentMeals
      .addCase(fetchRecentMeals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentMeals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.recentMeals = action.payload;
      })
      .addCase(fetchRecentMeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Handle addMealToLibrary
      .addCase(addMealToLibrary.fulfilled, (state, action) => {
        // Add the new meal to the beginning of recent meals
        state.recentMeals.unshift(action.payload);
        // Keep only the most recent 20 meals
        state.recentMeals = state.recentMeals.slice(0, 20);
      })
      .addCase(addMealToLibrary.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Handle searchMeals
      .addCase(searchMeals.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(searchMeals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchMeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetMealsError, clearSearchResults } = mealsSlice.actions;
export default mealsSlice.reducer;
