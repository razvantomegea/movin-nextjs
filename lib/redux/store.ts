import { configureStore } from "@reduxjs/toolkit"
import stakingReducer from "./slices/stakingSlice"
import activityRewardsReducer from "./slices/activityRewardsSlice"
import toastReducer from "./slices/toastSlice"
import referralRewardsReducer from "./slices/referralRewardsSlice"
import activityDataReducer from "./slices/activityDataSlice"
import energyDataReducer from "./slices/energyDataSlice"

export const store = configureStore({
  reducer: {
    staking: stakingReducer,
    activityRewards: activityRewardsReducer,
    toast: toastReducer,
    referralRewards: referralRewardsReducer,
    activityData: activityDataReducer,
    energyData: energyDataReducer,
  },
  // Add middleware to handle serialization issues with dates
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["staking/fetchStakingData/fulfilled"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["payload.startDate", "payload.endDate", "meta.arg"],
        // Ignore these paths in the state
        ignoredPaths: ["staking.stakes"],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
