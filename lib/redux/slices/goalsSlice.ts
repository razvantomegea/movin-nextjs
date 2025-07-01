import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import {
  getUserGoals,
  createDefaultGoals,
  updateAllGoalProgress,
  updateGoal,
  userHasGoals,
  type IGoal,
  type IGoalInput,
  type GoalCategory,
} from '@/lib/supabase/goals';

// Map database goal to UI goal format
export interface Goal {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  icon: string;
  autoTrigger: boolean;
  category: 'daily' | 'weekly' | 'monthly';
  goalType: string; // 'calories', 'protein', 'carbohydrates', 'fats', 'fiber', 'weight', 'fitness', 'steps', 'mets', 'duration'
}

interface GoalsState {
  goals: Goal[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

const initialState: GoalsState = {
  goals: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

// Map database goal to UI goal format
function mapGoalFromDB(dbGoal: IGoal): Goal {
  return {
    id: dbGoal.id,
    title: dbGoal.title,
    currentValue: dbGoal.current_value,
    targetValue: dbGoal.target_value,
    unit: dbGoal.unit,
    icon: dbGoal.icon,
    autoTrigger: dbGoal.auto_trigger,
    category: dbGoal.category as 'daily' | 'weekly' | 'monthly',
    goalType: dbGoal.goal_type,
  };
}

// Async thunk for fetching goals
export const fetchGoals = createAsyncThunk(
  'goals/fetchGoals',
  async (address: string, { rejectWithValue }) => {
    try {
      // Check if user has any goals
      const hasGoals = await userHasGoals({ address });

      // If no goals exist, create default goals
      if (!hasGoals) {
        await createDefaultGoals({ address });
      }

      // Update goal progress before fetching
      await updateAllGoalProgress({ address });

      // Fetch all goals for the user
      const dbGoals = await getUserGoals({ address });

      // Map to UI format
      const goals = dbGoals.map(mapGoalFromDB);

      return goals;
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      return rejectWithValue('Failed to fetch goals. Please try again later.');
    }
  },
);

// Async thunk for updating goal progress
export const updateGoalProgress = createAsyncThunk(
  'goals/updateProgress',
  async (
    { address, category }: { address: string; category?: GoalCategory },
    { rejectWithValue },
  ) => {
    try {
      if (category) {
        await updateAllGoalProgress({ address });
      } else {
        await updateAllGoalProgress({ address });
      }

      // Fetch updated goals
      const dbGoals = await getUserGoals({ address });
      const goals = dbGoals.map(mapGoalFromDB);

      return goals;
    } catch (error) {
      console.error('Failed to update goal progress:', error);
      return rejectWithValue('Failed to update goal progress.');
    }
  },
);

// Async thunk for updating a specific goal
export const updateGoalAsync = createAsyncThunk(
  'goals/updateGoal',
  async (
    {
      id,
      address,
      goalData,
    }: {
      id: string;
      address: string;
      goalData: Partial<IGoalInput>;
    },
    { rejectWithValue },
  ) => {
    try {
      const updatedGoal = await updateGoal({ id, address, goalData });
      return mapGoalFromDB(updatedGoal);
    } catch (error) {
      console.error('Failed to update goal:', error);
      return rejectWithValue('Failed to update goal. Please try again.');
    }
  },
);

const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    resetGoalsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch goals
      .addCase(fetchGoals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action: PayloadAction<Goal[]>) => {
        state.loading = false;
        state.goals = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'An unknown error occurred';
      })
      // Update goal progress
      .addCase(updateGoalProgress.pending, (state) => {
        // Don't show loading for progress updates to avoid UI flickering
      })
      .addCase(updateGoalProgress.fulfilled, (state, action: PayloadAction<Goal[]>) => {
        state.goals = action.payload;
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateGoalProgress.rejected, (state, action) => {
        state.error = (action.payload as string) || 'Failed to update goal progress';
      })
      // Update individual goal
      .addCase(updateGoalAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateGoalAsync.fulfilled, (state, action: PayloadAction<Goal>) => {
        state.loading = false;
        const updatedGoal = action.payload;
        const index = state.goals.findIndex((goal) => goal.id === updatedGoal.id);
        if (index !== -1) {
          state.goals[index] = updatedGoal;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateGoalAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to update goal';
      });
  },
});

export const { resetGoalsError } = goalsSlice.actions;
export default goalsSlice.reducer;
