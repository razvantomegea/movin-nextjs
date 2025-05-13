import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

export interface Goal {
  id: string;
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  icon: string;
  autoTrigger: boolean;
  category: 'daily' | 'weekly' | 'achievement';
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

// Mock data for demonstration
const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Step Goal',
    currentValue: 7842,
    targetValue: 10000,
    unit: 'steps',
    icon: 'steps',
    autoTrigger: false,
    category: 'daily',
  },
  {
    id: '2',
    title: 'Active Minutes',
    currentValue: 45,
    targetValue: 30,
    unit: 'min',
    icon: 'workout',
    autoTrigger: true,
    category: 'daily',
  },
  {
    id: '3',
    title: 'Workout Goal',
    currentValue: 5,
    targetValue: 5,
    unit: 'workouts',
    icon: 'workout',
    autoTrigger: true,
    category: 'weekly',
  },
  {
    id: '4',
    title: 'Distance Goal',
    currentValue: 18.5,
    targetValue: 20,
    unit: 'km',
    icon: 'steps',
    autoTrigger: false,
    category: 'weekly',
  },
  {
    id: '5',
    title: 'Activity Streak',
    currentValue: 7,
    targetValue: 7,
    unit: 'days',
    icon: 'streak',
    autoTrigger: true,
    category: 'achievement',
  },
  {
    id: '6',
    title: 'Level Progress',
    currentValue: 850,
    targetValue: 1000,
    unit: 'points',
    icon: 'level',
    autoTrigger: false,
    category: 'achievement',
  },
];

// Async thunk for fetching goals
export const fetchGoals = createAsyncThunk('goals/fetchGoals', async (_, { rejectWithValue }) => {
  try {
    // Simulate API call with delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real app, this would be an API call
    // const response = await fetch('/api/goals')
    // const data = await response.json()

    return mockGoals;
  } catch (error) {
    return rejectWithValue('Failed to fetch goals. Please try again later.');
  }
});

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
      });
  },
});

export const { resetGoalsError } = goalsSlice.actions;
export default goalsSlice.reducer;
