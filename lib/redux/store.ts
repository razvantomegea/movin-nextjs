import { configureStore } from "@reduxjs/toolkit"
import activityDataReducer from "./slices/activityDataSlice"
import activityRewardsReducer from "./slices/activityRewardsSlice"
import energyDataReducer from "./slices/energyDataSlice"
import referralRewardsReducer from "./slices/referralRewardsSlice"
import stakingReducer from "./slices/stakingSlice"
import toastReducer from "./slices/toastSlice"
import socialFeedReducer from "./slices/socialFeedSlice"

export const store = configureStore({
  reducer: {
    activityData: activityDataReducer,
    activityRewards: activityRewardsReducer,
    energyData: energyDataReducer,
    referralRewards: referralRewardsReducer,
    staking: stakingReducer,
    toast: toastReducer,
    socialFeed: socialFeedReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
