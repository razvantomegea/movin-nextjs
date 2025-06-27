import { configureStore } from '@reduxjs/toolkit';
import activityDataReducer from './slices/activityDataSlice';
import activityRewardsReducer from './slices/activityRewardsSlice';
import energyDataReducer from './slices/energyDataSlice';
import failedSavesReducer from './slices/failedSavesSlice';
import goalsReducer from './slices/goalsSlice';
import jointTrackingReducer from './slices/jointTrackingSlice';
import mealsReducer from './slices/mealsSlice';
import profileReducer from './slices/profileSlice';
import routeDataReducer from './slices/routeDataSlice';
import socialFeedReducer from './slices/socialFeedSlice';
import stakingReducer from './slices/stakingSlice';
import toastReducer from './slices/toastSlice';

export const store = configureStore({
  reducer: {
    staking: stakingReducer,
    activityRewards: activityRewardsReducer,
    toast: toastReducer,
    activityData: activityDataReducer,
    energyData: energyDataReducer,
    failedSaves: failedSavesReducer,
    meals: mealsReducer,
    socialFeed: socialFeedReducer,
    routeData: routeDataReducer,
    jointTracking: jointTrackingReducer,
    goals: goalsReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
