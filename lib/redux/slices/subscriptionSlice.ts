import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"

// Define types for our state
export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: "monthly" | "yearly"
  features: string[]
  recommended?: boolean
}

interface SubscriptionState {
  isPremium: boolean
  currentPlan: string | null
  expiryDate: string | null
  availablePlans: SubscriptionPlan[]
  isLoading: boolean
  error: string | null
}

// Initial state
const initialState: SubscriptionState = {
  isPremium: false,
  currentPlan: null,
  expiryDate: null,
  availablePlans: [
    {
      id: "free",
      name: "Free",
      price: 0,
      interval: "monthly",
      features: [
        "Basic step tracking",
        "Earn MVN tokens for activity",
        "Staking up to 12 months",
        "Referral program (1% rewards)",
        "Import from Apple Health & Google Fit",
        "Contains ads",
      ],
    },
    {
      id: "premium-monthly",
      name: "Premium",
      price: 100,
      interval: "monthly",
      features: [
        "Everything in Free plan",
        "MET tracking and advanced fitness metrics",
        "Ad-free experience",
        "24% APY staking for 2 years",
        "Access to maps & route tracking (soon)",
        "Friend sync for joint exercises (soon)",
        "AI based calorie tracking (soon)",
      ],
      recommended: true,
    },
    {
      id: "premium-yearly",
      name: "Premium",
      price: 1000,
      interval: "yearly",
      features: [
        "Everything in Free plan",
        "MET tracking and advanced fitness metrics",
        "Ad-free experience",
        "24% APY staking for 2 years",
        "Access to maps & route tracking (soon)",
        "Friend sync for joint exercises (soon)",
        "AI based calorie tracking (soon)",
      ],
    },
  ],
  isLoading: false,
  error: null,
}

// Async thunk for fetching subscription status
export const fetchSubscriptionStatus = createAsyncThunk(
  "subscription/fetchSubscriptionStatus",
  async (_, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simulate random error (10% chance)
      if (Math.random() < 0.1) {
        throw new Error("Failed to load subscription status. Please try again.")
      }

      // Return sample data (80% chance of being free, 20% premium)
      const isPremium = Math.random() < 0.2
      return {
        isPremium,
        currentPlan: isPremium ? "premium-monthly" : "free",
        expiryDate: isPremium
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
          : null,
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "An unknown error occurred")
    }
  },
)

// Async thunk for upgrading to premium
export const upgradeToPremium = createAsyncThunk(
  "subscription/upgradeToPremium",
  async (planId: string, { rejectWithValue }) => {
    try {
      // Simulate API call with delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulate random error (15% chance)
      if (Math.random() < 0.15) {
        throw new Error("Failed to upgrade subscription. Please try again.")
      }

      // Return success data
      const isYearly = planId.includes("yearly")
      const expiryDate = new Date(Date.now() + (isYearly ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()

      return {
        isPremium: true,
        currentPlan: planId,
        expiryDate,
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "An unknown error occurred")
    }
  },
)

// Create the slice
const subscriptionSlice = createSlice({
  name: "subscription",
  initialState,
  reducers: {
    resetSubscriptionError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle fetchSubscriptionStatus
      .addCase(fetchSubscriptionStatus.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchSubscriptionStatus.fulfilled, (state, action) => {
        state.isLoading = false
        state.isPremium = action.payload.isPremium
        state.currentPlan = action.payload.currentPlan
        state.expiryDate = action.payload.expiryDate
      })
      .addCase(fetchSubscriptionStatus.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Failed to load subscription status"
      })

      // Handle upgradeToPremium
      .addCase(upgradeToPremium.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(upgradeToPremium.fulfilled, (state, action) => {
        state.isLoading = false
        state.isPremium = action.payload.isPremium
        state.currentPlan = action.payload.currentPlan
        state.expiryDate = action.payload.expiryDate
      })
      .addCase(upgradeToPremium.rejected, (state, action) => {
        state.isLoading = false
        state.error = (action.payload as string) || "Failed to upgrade subscription"
      })
  },
})

export const { resetSubscriptionError } = subscriptionSlice.actions
export default subscriptionSlice.reducer
