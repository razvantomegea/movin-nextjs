import { configureStore } from '@reduxjs/toolkit';
import activityDataReducer from './slices/activityDataSlice';
import activityRewardsReducer from './slices/activityRewardsSlice';
import energyDataReducer from './slices/energyDataSlice';
import goalsReducer from './slices/goalsSlice';
import jointTrackingReducer from './slices/jointTrackingSlice';
import profileReducer from './slices/profileSlice';
import referralRewardsReducer from './slices/referralRewardsSlice';
import routeDataReducer from './slices/routeDataSlice';
import socialFeedReducer from './slices/socialFeedSlice';
import stakingReducer from './slices/stakingSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import toastReducer from './slices/toastSlice';

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
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
