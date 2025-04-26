import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

// Define types for our state
export interface DailyActivity {
  steps: number
  distance: number
  calories: number
  activeMinutes: number
  date: string
}

export interface TimeRangeData {
  label: string
  steps: number
  distance: number
  calories: number
  duration: number
}

export interface Workout {
  id: number
  type: string
  duration: string
  distance: string
  calories: number
  time: string
}

interface ActivityDataState {
  dailyActivity: DailyActivity
  weeklyData: TimeRangeData[]
  monthlyData: TimeRangeData[]
  yearlyData: TimeRangeData[]
  todaysWorkouts: Workout[]
  isLoading: boolean
  error: string | null
}

// Initial state
const initialState: ActivityDataState = {
  dailyActivity: {
    steps: 0,
    distance: 0,
    calories: 0,
    activeMinutes: 0,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  },
  weeklyData: [],
  monthlyData: [],
  yearlyData: [],
  todaysWorkouts: [],
  isLoading: false,
  error: null,
}

// Sample data for simulation
const sampleDailyActivity: DailyActivity = {
  steps: 7842,
  distance: 5.2,
  calories: 428,
  activeMinutes: 72,
  date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
}

const sampleWeeklyData: TimeRangeData[] = [
  { label: "Mon", steps: 100000, distance: 4.3, calories: 350, duration: 65 },
  { label: "Tue", steps: 4000, distance: 2.7, calories: 220, duration: 45 },
  { label: "Wed", steps: 8500, distance: 5.6, calories: 460, duration: 85 },
  { label: "Thu", steps: 10000, distance: 6.7, calories: 520, duration: 95 },
  { label: "Fri", steps: 5500, distance: 3.6, calories: 300, duration: 55 },
  { label: "Sat", steps: 3000, distance: 2.0, calories: 180, duration: 35 },
  { label: "Sun", steps: 6000, distance: 4.0, calories: 320, duration: 60 },
]

const sampleMonthlyData: TimeRangeData[] = [
  { label: "Week 1", steps: 42000, distance: 28.0, calories: 2200, duration: 420 },
  { label: "Week 2", steps: 38000, distance: 25.3, calories: 2000, duration: 380 },
  { label: "Week 3", steps: 45000, distance: 30.0, calories: 2400, duration: 450 },
  { label: "Week 4", steps: 40000, distance: 26.7, calories: 2100, duration: 400 },
]

const sampleYearlyData: TimeRangeData[] = [
  { label: "Jan", steps: 180000, distance: 120.0, calories: 9500, duration: 1800 },
  { label: "Feb", steps: 165000, distance: 110.0, calories: 8700, duration: 1650 },
  { label: "Mar", steps: 190000, distance: 126.7, calories: 10000, duration: 1900 },
  { label: "Apr", steps: 175000, distance: 116.7, calories: 9200, duration: 1750 },
  { label: "May", steps: 185000, distance: 123.3, calories: 9700, duration: 1850 },
  { label: "Jun", steps: 170000, distance: 113.3, calories: 8900, duration: 1700 },
  { label: "Jul", steps: 160000, distance: 106.7, calories: 8400, duration: 1600 },
  { label: "Aug", steps: 175000, distance: 116.7, calories: 9200, duration: 1750 },
  { label: "Sep", steps: 180000, distance: 120.0, calories: 9500, duration: 1800 },
  { label: "Oct", steps: 185000, distance: 123.3, calories: 9700, duration: 1850 },
  { label: "Nov", steps: 170000, distance: 113.3, calories: 8900, duration: 1700 },
  { label: "Dec", steps: 165000, distance: 110.0, calories: 8700, duration: 1650 },
]

const sampleTodaysWorkouts: Workout[] = [
  { id: 1, type: "Running", duration: "32 min", distance: "4.2 km", calories: 320, time: "8:30 AM" },
  { id: 2, type: "Cycling", duration: "45 min", distance: "12 km", calories: 380, time: "12:15 PM" },
  { id: 3, type: "HIIT", duration: "25 min", distance: "", calories: 280, time: "5:45 PM" },
]

// Async thunk for fetching activity data
export const fetchActivityData = createAsyncThunk("activityData/fetchActivityData", async (_, { rejectWithValue }) => {
  try {
    // Simulate API call with delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simulate random error (20% chance)
    if (Math.random() < 0.2) {
      throw new Error("Failed to load activity data. Please try again.")
    }

    // Return sample data
    return {
      dailyActivity: sampleDailyActivity,
      weeklyData: sampleWeeklyData,
      monthlyData: sampleMonthlyData,
      yearlyData: sampleYearlyData,
      todaysWorkouts: sampleTodaysWorkouts,
    }
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "An unknown error occurred")
  }
})

// Create the slice
const activityDataSlice = createSlice({
  name: "activityData",
  initialState,
  reducers: {
    resetActivityError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchActivityData
      .addCase(fetchActivityData.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchActivityData.fulfilled, (state, action) => {
        state.isLoading = false
        state.dailyActivity = action.payload.dailyActivity
        state.weeklyData = action.payload.weeklyData
        state.monthlyData = action.payload.monthlyData
        state.yearlyData = action.payload.yearlyData
        state.todaysWorkouts = action.payload.todaysWorkouts
      })
      .addCase(fetchActivityData.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Failed to load activity data"
      })
  },
})

export const { resetActivityError } = activityDataSlice.actions
export default activityDataSlice.reducer
