import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

// Define types for our state
export interface Meal {
  id: number
  name: string
  time: string
  calories: number
  carbs: number
  fats: number
  protein: number
}

export interface DailyCalories {
  consumed: number
  goal: number
  remaining: number
  breakfast: number
  lunch: number
  dinner: number
  snacks: number
  date: string
}

export interface EnergyData {
  label: string
  calories: number
  carbs: number
  fats: number
  protein: number
}

interface EnergyDataState {
  dailyCalories: DailyCalories
  weeklyEnergyData: EnergyData[]
  monthlyEnergyData: EnergyData[]
  yearlyEnergyData: EnergyData[]
  todaysMeals: Meal[]
  isLoading: boolean
  error: string | null
}

// Initial state
const initialState: EnergyDataState = {
  dailyCalories: {
    consumed: 0,
    goal: 2200,
    remaining: 2200,
    breakfast: 0,
    lunch: 0,
    dinner: 0,
    snacks: 0,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  },
  weeklyEnergyData: [],
  monthlyEnergyData: [],
  yearlyEnergyData: [],
  todaysMeals: [],
  isLoading: false,
  error: null,
}

// Sample data for simulation
const sampleDailyCalories: DailyCalories = {
  consumed: 1850,
  goal: 2200,
  remaining: 350,
  breakfast: 450,
  lunch: 650,
  dinner: 550,
  snacks: 200,
  date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
}

const sampleTodaysMeals: Meal[] = [
  {
    id: 1,
    name: "Breakfast - Oatmeal with Berries",
    time: "8:30 AM",
    calories: 450,
    carbs: 65,
    fats: 12,
    protein: 15,
  },
  {
    id: 2,
    name: "Lunch - Grilled Chicken Salad",
    time: "12:45 PM",
    calories: 650,
    carbs: 35,
    fats: 28,
    protein: 45,
  },
  {
    id: 3,
    name: "Dinner - Salmon with Vegetables",
    time: "7:15 PM",
    calories: 550,
    carbs: 30,
    fats: 25,
    protein: 40,
  },
  {
    id: 4,
    name: "Snack - Greek Yogurt with Honey",
    time: "3:30 PM",
    calories: 200,
    carbs: 25,
    fats: 5,
    protein: 15,
  },
]

const sampleWeeklyEnergyData: EnergyData[] = [
  { label: "Mon", calories: 2100, carbs: 230, fats: 70, protein: 110 },
  { label: "Tue", calories: 1950, carbs: 210, fats: 65, protein: 105 },
  { label: "Wed", calories: 2250, carbs: 250, fats: 75, protein: 120 },
  { label: "Thu", calories: 1850, carbs: 200, fats: 60, protein: 100 },
  { label: "Fri", calories: 2050, carbs: 220, fats: 70, protein: 110 },
  { label: "Sat", calories: 2300, carbs: 260, fats: 80, protein: 125 },
  { label: "Sun", calories: 1900, carbs: 210, fats: 65, protein: 100 },
]

const sampleMonthlyEnergyData: EnergyData[] = [
  { label: "Week 1", calories: 14500, carbs: 1600, fats: 480, protein: 780 },
  { label: "Week 2", calories: 15200, carbs: 1700, fats: 510, protein: 820 },
  { label: "Week 3", calories: 14800, carbs: 1650, fats: 490, protein: 800 },
  { label: "Week 4", calories: 15500, carbs: 1750, fats: 520, protein: 840 },
]

const sampleYearlyEnergyData: EnergyData[] = [
  { label: "Jan", calories: 62000, carbs: 6800, fats: 2100, protein: 3300 },
  { label: "Feb", calories: 58000, carbs: 6400, fats: 1900, protein: 3100 },
  { label: "Mar", calories: 64000, carbs: 7000, fats: 2200, protein: 3400 },
  { label: "Apr", calories: 61000, carbs: 6700, fats: 2000, protein: 3300 },
  { label: "May", calories: 63000, carbs: 6900, fats: 2100, protein: 3400 },
  { label: "Jun", calories: 60000, carbs: 6600, fats: 2000, protein: 3200 },
  { label: "Jul", calories: 62000, carbs: 6800, fats: 2100, protein: 3300 },
  { label: "Aug", calories: 65000, carbs: 7100, fats: 2200, protein: 3500 },
  { label: "Sep", calories: 61000, carbs: 6700, fats: 2000, protein: 3300 },
  { label: "Oct", calories: 63000, carbs: 6900, fats: 2100, protein: 3400 },
  { label: "Nov", calories: 59000, carbs: 6500, fats: 2000, protein: 3200 },
  { label: "Dec", calories: 64000, carbs: 7000, fats: 2200, protein: 3400 },
]

// Async thunk for fetching energy data
export const fetchEnergyData = createAsyncThunk("energyData/fetchEnergyData", async (_, { rejectWithValue }) => {
  try {
    // Simulate API call with delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simulate random error (20% chance)
    if (Math.random() < 0.2) {
      throw new Error("Failed to load energy data. Please try again.")
    }

    // Return sample data
    return {
      dailyCalories: sampleDailyCalories,
      weeklyEnergyData: sampleWeeklyEnergyData,
      monthlyEnergyData: sampleMonthlyEnergyData,
      yearlyEnergyData: sampleYearlyEnergyData,
      todaysMeals: sampleTodaysMeals,
    }
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "An unknown error occurred")
  }
})

// Async thunk for adding a meal
export const addMeal = createAsyncThunk("energyData/addMeal", async (meal: Omit<Meal, "id">, { rejectWithValue }) => {
  try {
    // Simulate API call with delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simulate random error (10% chance)
    if (Math.random() < 0.1) {
      throw new Error("Failed to add meal. Please try again.")
    }

    // Create a new meal with an ID
    const newMeal: Meal = {
      ...meal,
      id: Date.now(),
    }

    return newMeal
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "An unknown error occurred")
  }
})

// Async thunk for analyzing a meal image
export const analyzeMealImage = createAsyncThunk(
  "energyData/analyzeMealImage",
  async (imageData: string, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate random error (15% chance)
      if (Math.random() < 0.15) {
        throw new Error("Failed to analyze meal image. Please try again.")
      }

      // Simulate detected meal data
      const detectedMeal: Meal = {
        id: Date.now(),
        name: "Detected Meal - Mixed Salad with Chicken",
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "numeric", hour12: true }),
        calories: 450,
        carbs: 25,
        fats: 20,
        protein: 35,
      }

      return detectedMeal
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "An unknown error occurred")
    }
  },
)

// Create the slice
const energyDataSlice = createSlice({
  name: "energyData",
  initialState,
  reducers: {
    resetEnergyError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchEnergyData
      .addCase(fetchEnergyData.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchEnergyData.fulfilled, (state, action) => {
        state.isLoading = false
        state.dailyCalories = action.payload.dailyCalories
        state.weeklyEnergyData = action.payload.weeklyEnergyData
        state.monthlyEnergyData = action.payload.monthlyEnergyData
        state.yearlyEnergyData = action.payload.yearlyEnergyData
        state.todaysMeals = action.payload.todaysMeals
      })
      .addCase(fetchEnergyData.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Failed to load energy data"
      })

      // Handle addMeal
      .addCase(addMeal.fulfilled, (state, action) => {
        // Add the new meal to today's meals
        state.todaysMeals.unshift(action.payload)

        // Update daily calories
        state.dailyCalories.consumed += action.payload.calories
        state.dailyCalories.remaining = state.dailyCalories.goal - state.dailyCalories.consumed

        // Update meal type totals based on time
        const time = action.payload.time.toLowerCase()
        if (time.includes("am") && Number.parseInt(time) < 11) {
          state.dailyCalories.breakfast += action.payload.calories
        } else if (time.includes("pm") && Number.parseInt(time) < 3) {
          state.dailyCalories.lunch += action.payload.calories
        } else if (time.includes("pm") && Number.parseInt(time) >= 5) {
          state.dailyCalories.dinner += action.payload.calories
        } else {
          state.dailyCalories.snacks += action.payload.calories
        }
      })
      .addCase(addMeal.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to add meal"
      })

      // Handle analyzeMealImage
      .addCase(analyzeMealImage.fulfilled, (state, action) => {
        // Add the detected meal to today's meals
        state.todaysMeals.unshift(action.payload)

        // Update daily calories
        state.dailyCalories.consumed += action.payload.calories
        state.dailyCalories.remaining = state.dailyCalories.goal - state.dailyCalories.consumed

        // Update meal type totals based on time
        const time = action.payload.time.toLowerCase()
        if (time.includes("am") && Number.parseInt(time) < 11) {
          state.dailyCalories.breakfast += action.payload.calories
        } else if (time.includes("pm") && Number.parseInt(time) < 3) {
          state.dailyCalories.lunch += action.payload.calories
        } else if (time.includes("pm") && Number.parseInt(time) >= 5) {
          state.dailyCalories.dinner += action.payload.calories
        } else {
          state.dailyCalories.snacks += action.payload.calories
        }
      })
      .addCase(analyzeMealImage.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to analyze meal image"
      })
  },
})

export const { resetEnergyError } = energyDataSlice.actions
export default energyDataSlice.reducer
