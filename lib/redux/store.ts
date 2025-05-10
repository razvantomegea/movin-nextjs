import { configureStore } from "@reduxjs/toolkit"
import stakingReducer from "./slices/stakingSlice"
import activityRewardsReducer from "./slices/activityRewardsSlice"
import toastReducer from "./slices/toastSlice"
import referralRewardsReducer from "./slices/referralRewardsSlice"
import activityDataReducer from "./slices/activityDataSlice"
import energyDataReducer from "./slices/energyDataSlice"
import socialFeedReducer from "./slices/socialFeedSlice"
import routeDataReducer from "./slices/routeDataSlice"
import jointTrackingReducer from "./slices/jointTrackingSlice"
import goalsReducer from "./slices/goalsSlice"
import profileReducer from "./slices/profileSlice"
import subscriptionReducer from "./slices/subscriptionSlice"

export const store = configureStore({
  reducer: {
    staking: stakingReducer,
    activityRewards: activityRewardsReducer,
    toast: toastReducer,
    referralRewards: referralRewardsReducer,
    activityData: activityDataReducer,
    energyData: energyDataReducer,
    socialFeed: socialFeedReducer,
    routeData: routeDataReducer,
    jointTracking: jointTrackingReducer,
    goals: goalsReducer,
    profile: profileReducer,
    subscription: subscriptionReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
