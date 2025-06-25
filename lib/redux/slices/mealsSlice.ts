import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as Sentry from '@sentry/nextjs';
import {
  IMeal,
  getRecentMeals,
  insertMeal,
  searchMealsByName,
  deleteMeal as deleteMealFromSupabase,
  updateMeal as updateMealInSupabase, // Import the actual function
} from '@/lib/supabase/meals';

interface MealsState {
  recentMeals: IMeal[];
  searchResults: IMeal[];
  isLoading: boolean; // General loading state for fetch/search
  isUpdating: boolean; // Specific loading state for add/update/delete
  error: string | null;
}

const initialState: MealsState = {
  recentMeals: [],
  searchResults: [],
  isLoading: false,
  isUpdating: false,
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

// Async thunk for adding a meal to the library
export const addMealToLibrary = createAsyncThunk(
  'meals/addMealToLibrary',
  async (
    { address, mealData }: { address: string; mealData: Partial<IMeal> },
    { rejectWithValue },
  ) => {
    try {
      if (!address) throw new Error('Address is required to add meal to library');
      const newMeal = await insertMeal({ address, mealData });
      return newMeal;
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

// Async thunk for deleting a meal from the library
export const deleteMealFromLibrary = createAsyncThunk(
  'meals/deleteMealFromLibrary',
  async ({ mealId, address }: { mealId: string; address: string }, { rejectWithValue }) => {
    try {
      await deleteMealFromSupabase({ id: mealId, address });
      return mealId; // Return the ID of the deleted meal for reducer logic
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete meal from library',
      );
    }
  },
);

// Async thunk for updating a meal in the library
export const updateMealInLibrary = createAsyncThunk(
  'meals/updateMealInLibrary',
  async (
    { mealId, address, mealData }: { mealId: string; address: string; mealData: Partial<IMeal> },
    { rejectWithValue },
  ) => {
    try {
      const updatedMeal = await updateMealInSupabase({ mealId, address, mealData });
      return updatedMeal;
    } catch (error) {
      Sentry.captureException(error);
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to update meal in library',
      );
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
      .addCase(addMealToLibrary.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(addMealToLibrary.fulfilled, (state, action) => {
        state.isUpdating = false;
        // Add the new meal to the beginning of recent meals and ensure unique
        state.recentMeals = [
          action.payload,
          ...state.recentMeals.filter((meal) => meal.id !== action.payload.id),
        ].slice(0, 20); // Keep only the most recent 20
      })
      .addCase(addMealToLibrary.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })

      // Handle searchMeals
      .addCase(searchMeals.pending, (state) => {
        state.isLoading = true; // Use general isLoading for search
        state.error = null;
      })
      .addCase(searchMeals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchMeals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Handle deleteMealFromLibrary
      .addCase(deleteMealFromLibrary.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(deleteMealFromLibrary.fulfilled, (state, action) => {
        state.isUpdating = false;
        const deletedMealId = action.payload;
        state.recentMeals = state.recentMeals.filter((meal) => meal.id !== deletedMealId);
        state.searchResults = state.searchResults.filter((meal) => meal.id !== deletedMealId);
      })
      .addCase(deleteMealFromLibrary.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      })

      // Handle updateMealInLibrary
      .addCase(updateMealInLibrary.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateMealInLibrary.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedMeal = action.payload;
        state.recentMeals = state.recentMeals.map((meal) =>
          meal.id === updatedMeal.id ? updatedMeal : meal,
        );
        state.searchResults = state.searchResults.map((meal) =>
          meal.id === updatedMeal.id ? updatedMeal : meal,
        );
      })
      .addCase(updateMealInLibrary.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetMealsError, clearSearchResults } = mealsSlice.actions;
export default mealsSlice.reducer;
