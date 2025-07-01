'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import {
  Activity,
  Clock,
  Flame,
  TrendingUp,
  RefreshCw,
  Dumbbell,
  MapPin,
  Upload,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { ActivityColumnChart } from '@/app/dashboard/components/activity-column-chart';
import { CelebrationAnimation } from '@/components/celebration-animation';
import { CircularProgress } from '@/components/circular-progress';
import ErrorBoundary from '@/components/error-boundary';
import { RefreshButton } from '@/components/refresh-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Progress } from '@/components/ui/progress';
import { DataTestIds } from '@/constants/dataTestIds.mjs';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchActivities, addActivities } from '@/lib/redux/slices/activityDataSlice';
import { fetchEnergyData } from '@/lib/redux/slices/energyDataSlice';
import {
  addFailedSave,
  retryAllFailedSaves,
  retryFailedSave,
  removeFailedSave,
} from '@/lib/redux/slices/failedSavesSlice';
import { updateGoalProgress } from '@/lib/redux/slices/goalsSlice';
import { resetJointTracking } from '@/lib/redux/slices/jointTrackingSlice';
import { fetchProfile, updateProfile } from '@/lib/redux/slices/profileSlice';
import { createPost } from '@/lib/redux/slices/socialFeedSlice';
import { showSuccessToast, showInfoToast } from '@/lib/redux/slices/toastSlice';
import type { RootState } from '@/lib/redux/store';
import { IActivity } from '@/lib/supabase/activities';
import {
  formatDistance,
  formatDuration,
  mapActivitiesToDaily,
  mapActivitiesToTodaysWorkouts,
  mapActivitiesToWeekly,
  mapActivitiesToMonthly,
  mapActivitiesToYearly,
  mapRouteToActivity,
  type DailyActivity,
  type Workout,
  type TimeRangeData,
  getTodayDate,
} from '@/utils';
import {
  generateAchievementPostContent,
  createAchievementData,
} from '@/utils/achievements/shareAchievement';
import {
  sendStepsGoalNotification,
  sendStreakMilestoneNotification,
  sendWorkoutCompletionNotification,
} from '@/utils/notifications/pushNotifications';
import { ActivityDashboardSkeleton } from './activity-dashboard-skeleton';
import { RouteTrackingModal, type RouteData } from './route-tracking-modal';
import { RouteTypeModal } from './route-type-modal';
import { ScreenshotImportModal } from './screenshot-import-modal';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

type MetricType = 'steps' | 'calories' | 'duration' | 'mets';

export function MovinDashboard() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [refreshing, setRefreshing] = useState(true);
  const [isRouteTypeModalOpen, setIsRouteTypeModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [isJointTrackingSelected, setIsJointTrackingSelected] = useState(false);
  const [isScreenshotImportModalOpen, setIsScreenshotImportModalOpen] = useState(false);
  const [showStepsCelebration, setShowStepsCelebration] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState(0);
  const [showFailedSavesDetails, setShowFailedSavesDetails] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('steps');
  const currentDate = useMemo(() => new Date(), []);
  const { address } = useAppKitAccount();
  const addressLower = useMemo(() => address?.toLowerCase(), [address]);

  const dispatch = useAppDispatch();

  const { activities, isLoading, error } = useAppSelector((state: RootState) => state.activityData);
  const { energyEntries } = useAppSelector((state: RootState) => state.energyData);
  const { profile } = useAppSelector((state: RootState) => state.profile);
  const { failedSaves, isRetrying } = useAppSelector((state: RootState) => state.failedSaves);

  // Memoize derived data
  const dailyActivity: DailyActivity | null = useMemo(() => {
    if (activities.length > 0) {
      return mapActivitiesToDaily(activities, currentDate);
    }
    return null;
  }, [activities, currentDate]);

  const todaysWorkouts: Workout[] = useMemo(() => {
    return mapActivitiesToTodaysWorkouts(activities, currentDate);
  }, [activities, currentDate]);

  const weeklyChartData: TimeRangeData[] = useMemo(() => {
    return mapActivitiesToWeekly(activities, currentDate);
  }, [activities, currentDate]);

  const monthlyChartData: TimeRangeData[] = useMemo(() => {
    return mapActivitiesToMonthly(activities, currentDate);
  }, [activities, currentDate]);

  const yearlyChartData: TimeRangeData[] = useMemo(() => {
    return mapActivitiesToYearly(activities, currentDate);
  }, [activities, currentDate]);

  // Get metric data and goals based on selected metric
  const getMetricData = useMemo(() => {
    if (!dailyActivity) {
      return {
        current: 0,
        goal: 0,
        unit: '',
        displayValue: '0',
        goalDisplay: '0',
        percentage: 0,
      };
    }

    switch (selectedMetric) {
      case 'steps':
        return {
          current: dailyActivity.steps,
          goal: 10000,
          unit: 'steps',
          displayValue: dailyActivity.steps.toLocaleString(),
          goalDisplay: '10,000',
          percentage: Math.min((dailyActivity.steps / 10000) * 100, 100),
        };
      case 'calories':
        return {
          current: dailyActivity.calories,
          goal: 600,
          unit: 'kcal',
          displayValue: dailyActivity.calories.toLocaleString(),
          goalDisplay: '600',
          percentage: Math.min((dailyActivity.calories / 600) * 100, 100),
        };
      case 'duration': {
        const hours = Math.floor(dailyActivity.activeMinutes / 60);
        const minutes = Math.round(dailyActivity.activeMinutes % 60);
        return {
          current: dailyActivity.activeMinutes,
          goal: 60,
          unit: 'min',
          displayValue: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
          goalDisplay: '60',
          percentage: Math.min((dailyActivity.activeMinutes / 60) * 100, 100),
        };
      }
      case 'mets':
        return {
          current: dailyActivity.mets,
          goal: 25,
          unit: 'METs',
          displayValue: dailyActivity.mets.toString(),
          goalDisplay: '25',
          percentage: Math.min((dailyActivity.mets / 25) * 100, 100),
        };
      default:
        return {
          current: 0,
          goal: 0,
          unit: '',
          displayValue: '0',
          goalDisplay: '0',
          percentage: 0,
        };
    }
  }, [dailyActivity, selectedMetric]);

  const handleMetricClick = useCallback((metric: MetricType) => {
    setSelectedMetric(metric);
  }, []);

  useEffect(() => {
    const today = getTodayDate();
    const celebrationShown = localStorage.getItem(`steps-celebration-${today}`);

    if (
      dailyActivity &&
      dailyActivity.steps >= 10000 &&
      !celebrationShown &&
      !isLoading &&
      addressLower
    ) {
      setShowStepsCelebration(true);
      localStorage.setItem(`steps-celebration-${today}`, 'true');

      // Send push notification in the background
      sendStepsGoalNotification(addressLower, dailyActivity.steps).catch((error) => {
        console.error('Failed to send steps goal notification:', error);
      });
    }
  }, [dailyActivity, isLoading, addressLower]);

  // Function to check if the given date is yesterday
  const isYesterday = useCallback((date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    );
  }, []);

  // Function to update streak based on activity patterns
  const updateStreakCount = useCallback(() => {
    if (!addressLower || !profile || (!activities && !energyEntries)) return;

    // Check if streak was already updated today
    if (profile.last_streak_update) {
      const lastUpdate = new Date(profile.last_streak_update);
      const today = new Date();

      // If streak was already updated today, don't update again
      if (
        lastUpdate.getDate() === today.getDate() &&
        lastUpdate.getMonth() === today.getMonth() &&
        lastUpdate.getFullYear() === today.getFullYear()
      ) {
        return;
      }
    }

    const isToday = (date: Date) => {
      const today = new Date();
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };

    // Check if there are activities today
    const hasActivityToday = (activities || []).some((activity) => {
      return isToday(new Date(activity.start_date));
    });

    const hasMealToday = (energyEntries || []).some((entry) => {
      return isToday(new Date(`${entry.log_date}T00:00:00`));
    });

    // If no activity today, do nothing
    if (!hasActivityToday && !hasMealToday) return;

    // Check if there was activity yesterday
    const hasActivityYesterday = (activities || []).some((activity) => {
      return isYesterday(new Date(activity.start_date));
    });

    const hasMealYesterday = (energyEntries || []).some((entry) =>
      isYesterday(new Date(`${entry.log_date}T00:00:00`)),
    );
    const hasEventYesterday = hasActivityYesterday || hasMealYesterday;

    // Update streak count
    if (hasEventYesterday) {
      // Increment streak
      const newStreakDays = (profile.streak_days || 0) + 1;
      dispatch(
        updateProfile({
          address: addressLower,
          profileData: {
            streak_days: newStreakDays,
            last_streak_update: new Date().toISOString(),
          },
        }),
      );

      // Check for streak milestones
      const milestones = [7, 30, 100, 365];
      if (milestones.includes(newStreakDays)) {
        setStreakMilestone(newStreakDays);
        setShowStreakCelebration(true);

        // Send push notification in the background
        sendStreakMilestoneNotification(addressLower, newStreakDays).catch((error) => {
          console.error('Failed to send streak milestone notification:', error);
        });
      }
    } else {
      // Reset streak to 1 (since there's activity today)
      dispatch(
        updateProfile({
          address: addressLower,
          profileData: {
            streak_days: 1,
            last_streak_update: new Date().toISOString(),
          },
        }),
      );
    }
  }, [addressLower, profile, activities, energyEntries, dispatch, isYesterday]);

  // Update streak when activities are loaded
  useEffect(() => {
    if (!isLoading && !refreshing && (activities || energyEntries) && profile) {
      updateStreakCount();
    }
  }, [isLoading, refreshing, activities, energyEntries, profile, updateStreakCount]);

  const handleRefresh = useCallback(async () => {
    if (!addressLower) {
      return;
    }

    setRefreshing(true);

    try {
      // Retry any failed saves first
      if (failedSaves.length > 0) {
        await dispatch(retryAllFailedSaves()).unwrap();
      }

      // Then refresh the data
      await dispatch(fetchActivities(addressLower)).unwrap();
      await dispatch(fetchProfile(addressLower)).unwrap();
      await dispatch(fetchEnergyData(addressLower)).unwrap();

      // Update goal progress after refreshing data
      try {
        await dispatch(updateGoalProgress({ address: addressLower })).unwrap();
      } catch (goalError) {
        console.error('Failed to update goal progress:', goalError);
        // Don't show error for goal updates as it's not critical
      }

      // Show success message if there were failed saves that were retried
      if (failedSaves.length > 0) {
        dispatch(
          showSuccessToast({
            title: 'Retry Successful',
            description: `Successfully retried ${failedSaves.length} failed save(s) and refreshed data.`,
          }),
        );
      }
    } catch (error) {
      console.error('Refresh or retry failed:', error);
      dispatch(
        showInfoToast({
          title: 'Refresh Failed',
          description: 'Some operations failed. Please check your connection and try again.',
        }),
      );
    }

    setRefreshing(false);
  }, [addressLower, dispatch, failedSaves.length]);

  useEffect(() => {
    if (addressLower) {
      handleRefresh();
    }
  }, [handleRefresh, addressLower]);

  useEffect(() => {
    return () => {
      dispatch(resetJointTracking());
    };
  }, [dispatch]);

  const handleSaveRoute = async (routeData: RouteData) => {
    if (!addressLower) {
      return;
    }

    const newActivity = mapRouteToActivity(routeData, addressLower);

    try {
      // Dispatch addActivities to save the new activity
      await dispatch(
        addActivities({ address: addressLower, activityData: [newActivity] }),
      ).unwrap();

      dispatch(
        showSuccessToast({
          title: routeData.isJoint ? 'Joint Route Saved as Activity' : 'Route Saved as Activity',
          description: `${formatDistance(routeData.distance)} in ${formatDuration(
            routeData.duration,
          )}${
            routeData.isJoint ? ` with ${routeData.participants?.length || 0} participants` : ''
          }`,
        }),
      );

      // Update goal progress after saving new activity
      try {
        await dispatch(updateGoalProgress({ address: addressLower, category: 'daily' })).unwrap();
      } catch (goalError) {
        console.error('Failed to update goal progress:', goalError);
      }

      // Send push notification in the background
      const workoutType = routeData.isJoint ? 'Joint Route' : 'Route';
      sendWorkoutCompletionNotification(
        addressLower,
        workoutType,
        routeData.duration,
        routeData.distance / 1000, // Convert meters to kilometers
      ).catch((error) => {
        console.error('Failed to send workout completion notification:', error);
      });

      // Reset joint tracking state if it was a joint run
      if (routeData.isJoint) {
        dispatch(resetJointTracking());
      }
    } catch (error) {
      console.error('Failed to save activity:', error);

      // Add to failed saves queue for retry
      dispatch(
        addFailedSave({
          type: 'add',
          dataType: 'activity',
          address: addressLower,
          activityData: [newActivity],
          error: error instanceof Error ? error.message : 'Failed to save activity',
        }),
      );

      dispatch(
        showInfoToast({
          title: 'Failed to Save Activity',
          description:
            'Activity has been queued for retry. Please check your connection and try refreshing.',
        }),
      );
    }
  };

  // Handle opening the route type modal
  const handleOpenRouteTracking = () => {
    setIsRouteTypeModalOpen(true);
  };

  // Handle opening the screenshot import modal (available to all users)
  const handleOpenScreenshotImport = () => {
    setIsScreenshotImportModalOpen(true);
  };

  // Handle selecting single route tracking
  const handleSelectSingleTracking = () => {
    setIsRouteTypeModalOpen(false);
    setIsJointTrackingSelected(false);
    setIsRouteModalOpen(true);
  };

  // Handle selecting joint route tracking
  const handleSelectJointTracking = () => {
    setIsRouteTypeModalOpen(false);
    setIsJointTrackingSelected(true);
    setIsRouteModalOpen(true);
  };

  // Handle closing the route modal
  const handleCloseRouteModal = () => {
    setIsRouteModalOpen(false);
    dispatch(resetJointTracking());
  };

  // Handle saving imported activity from screenshot
  const handleSaveImportedActivity = async (activityData: Partial<IActivity>) => {
    if (!addressLower) {
      return;
    }

    try {
      // Add the user's address to the activity data (already processed by mapScreenshotToActivity)
      const activityWithAddress = { ...activityData, address: addressLower };

      // For new activities or non-Steps activities, add as new
      await dispatch(
        addActivities({ address: addressLower, activityData: [activityWithAddress] }),
      ).unwrap();

      // Update goal progress after saving imported activity
      try {
        await dispatch(updateGoalProgress({ address: addressLower, category: 'daily' })).unwrap();
      } catch (goalError) {
        console.error('Failed to update goal progress:', goalError);
      }

      // Success toast is now handled in the screenshot import modal

      // Send push notification in the background (only for non-Steps activities to avoid spam)
      if (activityWithAddress.name !== 'Steps') {
        sendWorkoutCompletionNotification(
          addressLower,
          activityWithAddress.name || 'Imported Workout',
          activityWithAddress.duration || 0,
          activityWithAddress.total_distance
            ? activityWithAddress.total_distance / 1000
            : undefined,
        ).catch((error) => {
          console.error('Failed to send workout completion notification:', error);
        });
      }
    } catch (error) {
      console.error('Failed to save imported activity:', error);

      // Add the user's address to the activity data
      const activityWithAddress = { ...activityData, address: addressLower };
      const operationType: 'add' | 'update' = 'add';
      const activityForQueue = activityWithAddress;

      // Add to failed saves queue for retry
      dispatch(
        addFailedSave({
          type: operationType,
          dataType: 'activity',
          address: addressLower,
          activityData: operationType === 'add' ? [activityForQueue] : activityForQueue,
          error: error instanceof Error ? error.message : 'Failed to import workout',
        }),
      );

      // Error toast is now handled in the screenshot import modal
      // Re-throw the error so the modal can handle it
      throw error;
    }
  };

  const handleCloseStepsCelebration = useCallback(() => {
    setShowStepsCelebration(false);
  }, []);

  const handleCloseStreakCelebration = useCallback(() => {
    setShowStreakCelebration(false);
  }, []);

  // Achievement sharing handlers
  const handleShareStepsAchievement = useCallback(async () => {
    if (!addressLower || !dailyActivity) return;

    try {
      const achievementData = createAchievementData(
        'steps',
        '10,000 steps',
        'Daily Steps Goal',
        'Congratulations on reaching your daily steps goal!',
      );

      const postContent = generateAchievementPostContent(achievementData);

      await dispatch(
        createPost({
          address: addressLower,
          postData: { content: postContent },
        }),
      ).unwrap();

      dispatch(
        showSuccessToast({
          title: 'Achievement Shared!',
          description: 'Your steps achievement has been shared with your connections.',
        }),
      );

      setShowStepsCelebration(false);
    } catch (error) {
      console.error('Failed to share steps achievement:', error);
      dispatch(
        showInfoToast({
          title: 'Share Failed',
          description: 'Unable to share achievement. Please try again.',
        }),
      );
    }
  }, [addressLower, dailyActivity, dispatch]);

  const handleShareStreakAchievement = useCallback(async () => {
    if (!addressLower || !streakMilestone) return;

    try {
      const achievementData = createAchievementData(
        'streak',
        `${streakMilestone} days`,
        'Streak Milestone',
        `Congratulations on maintaining a ${streakMilestone}-day activity streak!`,
      );

      const postContent = generateAchievementPostContent(achievementData);

      await dispatch(
        createPost({
          address: addressLower,
          postData: { content: postContent },
        }),
      ).unwrap();

      dispatch(
        showSuccessToast({
          title: 'Achievement Shared!',
          description: 'Your streak milestone has been shared with your connections.',
        }),
      );

      setShowStreakCelebration(false);
    } catch (error) {
      console.error('Failed to share streak achievement:', error);
      dispatch(
        showInfoToast({
          title: 'Share Failed',
          description: 'Unable to share achievement. Please try again.',
        }),
      );
    }
  }, [addressLower, streakMilestone, dispatch]);

  // Handle individual retry of failed save
  const handleRetryFailedSave = useCallback(
    async (failedSaveId: string) => {
      const failedSave = failedSaves.find((save) => save.id === failedSaveId);
      if (!failedSave) return;

      try {
        await dispatch(retryFailedSave(failedSave)).unwrap();
        dispatch(
          showSuccessToast({
            title: 'Save Successful',
            description: 'The failed save has been successfully retried.',
          }),
        );
      } catch (error) {
        dispatch(
          showInfoToast({
            title: 'Retry Failed',
            description: 'Unable to retry the save. Please check your connection.',
          }),
        );
      }
    },
    [failedSaves, dispatch],
  );

  // Handle removing a failed save from the queue
  const handleRemoveFailedSave = useCallback(
    (failedSaveId: string) => {
      dispatch(removeFailedSave(failedSaveId));
      dispatch(
        showInfoToast({
          title: 'Save Removed',
          description: 'The failed save has been removed from the retry queue.',
        }),
      );
    },
    [dispatch],
  );

  // Render the dashboard content
  const renderDashboardContent = () => {
    if (isLoading || refreshing) {
      return <ActivityDashboardSkeleton />;
    }

    if (error) {
      return (
        <div className="space-y-4">
          <ErrorAlert message={error} />
          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    return (
      <motion.div className="space-y-6" variants={container} initial="hidden" animate="show">
        {/* Daily Activity Card */}
        <motion.div variants={item}>
          <Card
            className={`${
              isDark
                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700'
                : 'bg-gradient-to-br from-white to-gray-100 border-gray-200'
            }`}
            data-testid={DataTestIds.DASHBOARD_DAILY_ACTIVITY_CARD}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                    <Activity className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">Today</span>
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {dailyActivity ? dailyActivity.date : new Date().toLocaleDateString()}
                </span>
              </div>

              {dailyActivity ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-baseline">
                        <motion.span
                          className="text-4xl font-bold"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                          data-testid={DataTestIds.DASHBOARD_DAILY_STEPS}
                          key={selectedMetric}
                        >
                          {getMetricData.displayValue}
                        </motion.span>
                        <span
                          className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}
                        >
                          / {getMetricData.goalDisplay} {getMetricData.unit}
                        </span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <Progress value={getMetricData.percentage} className="h-2 mt-3" />
                      </motion.div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                        <motion.div
                          className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors ${
                            selectedMetric === 'steps'
                              ? 'bg-blue-500/20 ring-2 ring-blue-500/50'
                              : 'hover:bg-blue-500/10'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          onClick={() => handleMetricClick('steps')}
                        >
                          <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium">
                            {dailyActivity.steps.toLocaleString()}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            steps
                          </span>
                        </motion.div>

                        <motion.div
                          className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors ${
                            selectedMetric === 'calories'
                              ? 'bg-blue-500/20 ring-2 ring-blue-500/50'
                              : 'hover:bg-blue-500/10'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          onClick={() => handleMetricClick('calories')}
                        >
                          <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                            <Flame className="h-4 w-4 text-blue-500" />
                          </div>
                          <span
                            className="text-sm font-medium"
                            data-testid={DataTestIds.DASHBOARD_DAILY_CALORIES}
                          >
                            {dailyActivity.calories.toLocaleString()}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            kcal
                          </span>
                        </motion.div>

                        <motion.div
                          className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors ${
                            selectedMetric === 'duration'
                              ? 'bg-blue-500/20 ring-2 ring-blue-500/50'
                              : 'hover:bg-blue-500/10'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          onClick={() => handleMetricClick('duration')}
                        >
                          <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                          </div>
                          <span
                            className="text-sm font-medium"
                            data-testid={DataTestIds.DASHBOARD_DAILY_DURATION}
                          >
                            {Math.floor(dailyActivity.activeMinutes / 60)}h{' '}
                            {Math.round(dailyActivity.activeMinutes % 60)}m
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            active
                          </span>
                        </motion.div>

                        {/* METs metric */}
                        <motion.div
                          className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors ${
                            selectedMetric === 'mets'
                              ? 'bg-blue-500/20 ring-2 ring-blue-500/50'
                              : 'hover:bg-blue-500/10'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                          onClick={() => handleMetricClick('mets')}
                        >
                          <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                            <Activity className="h-4 w-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium" data-testid="dashboard-daily-mets">
                            {dailyActivity.mets}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            METs
                          </span>
                        </motion.div>
                      </div>
                    </div>

                    <div className="ml-6">
                      <CircularProgress
                        value={Math.round(getMetricData.percentage)}
                        size={100}
                        strokeWidth={8}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className="text-center py-8 text-gray-500"
                  data-testid={DataTestIds.DASHBOARD_EMPTY_STATE}
                >
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No activity data recorded for today.</p>
                  <p className="text-xs mt-2">
                    Track a run or sync your device to see your progress.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Chart */}
        <motion.div className="space-y-4" variants={item}>
          <h2 className="text-lg font-medium">Activity Overview</h2>
          <ActivityColumnChart
            weeklyData={weeklyChartData}
            monthlyData={monthlyChartData}
            yearlyData={yearlyChartData}
            isLoading={isLoading}
          />
        </motion.div>

        {/* Today&apos;s Workouts */}
        <motion.div className="space-y-4" variants={item}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-medium">Today&apos;s Workouts</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleOpenScreenshotImport}
                size="sm"
                aria-label="Import Workout"
                className="bg-purple-500 hover:bg-purple-600"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Workout
              </Button>
              <Button
                onClick={handleOpenRouteTracking}
                size="sm"
                aria-label="Track Route"
                className="bg-blue-500 hover:bg-blue-600"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Track Route
              </Button>
            </div>
          </div>
          <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
            <CardContent className="p-6">
              {todaysWorkouts.length === 0 ? (
                <div
                  className="text-center py-8 text-gray-500"
                  data-testid={DataTestIds.DASHBOARD_EMPTY_WORKOUTS}
                >
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No workouts recorded today</p>
                  {failedSaves.length > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-amber-700 dark:text-amber-300 text-sm mb-2">
                        {failedSaves.length} workout{failedSaves.length !== 1 ? 's' : ''} failed to
                        save
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRetrying}
                        className="mr-2"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Retrying...' : 'Retry Saves'}
                      </Button>
                    </div>
                  )}
                  <Button variant="outline" className="mt-4" onClick={handleOpenScreenshotImport}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Workout
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysWorkouts.map((workout, i) => (
                    <motion.div
                      key={workout.id}
                      className={`flex items-center p-3 ${
                        isDark ? 'bg-gray-800/50' : 'bg-gray-200/70'
                      } rounded-lg`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                      data-testid={DataTestIds.DASHBOARD_WORKOUT_ROW}
                    >
                      <div className="bg-blue-500/20 p-2 rounded-full mr-3">
                        <Activity className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{workout.type}</span>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {workout.time}
                          </span>
                        </div>
                        <div
                          className={`flex text-sm ${
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          } mt-1`}
                        >
                          <span className="mr-3">
                            Duration: {formatDuration(workout.rawDuration)}
                          </span>
                          {workout.rawDistance && (
                            <span className="mr-3">
                              Distance: {formatDistance(workout.rawDistance)}
                            </span>
                          )}
                          <span>Calories: {workout.calories} kcal</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <>
      <motion.div
        className="p-4"
        initial="hidden"
        animate="show"
        variants={container}
        data-testid="dashboard-container"
      >
        <motion.div className="flex items-center mb-6" variants={item}>
          <h1 className="text-2xl font-bold mr-2">Activities</h1>
          {/* Failed saves indicator */}
          {failedSaves.length > 0 && (
            <button
              onClick={() => setShowFailedSavesDetails(!showFailedSavesDetails)}
              className="mr-3 px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 text-xs rounded-md border border-amber-200 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors duration-200 flex items-center"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {failedSaves.length} pending save{failedSaves.length !== 1 ? 's' : ''}
              {showFailedSavesDetails ? (
                <ChevronUp className="h-3 w-3 ml-1" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-1" />
              )}
            </button>
          )}
          {/* Conditionally render the refresh button */}
          {
            <RefreshButton
              onRefresh={handleRefresh}
              isLoading={isLoading || refreshing || isRetrying}
            />
          }
        </motion.div>

        {/* Failed Saves Details */}
        {failedSaves.length > 0 && showFailedSavesDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
            variants={item}
          >
            <Card
              className={`${
                isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-amber-800 dark:text-amber-200">
                    Failed Saves Queue
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleRefresh}
                      disabled={isRetrying}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                      {isRetrying ? 'Retrying All...' : 'Retry All'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {failedSaves.map((failedSave) => (
                    <div
                      key={failedSave.id}
                      className={`p-3 rounded-lg border ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="text-sm font-medium">
                              {failedSave.type === 'add' ? 'Add Activity' : 'Update Activity'}
                            </span>
                            <span
                              className={`ml-2 px-2 py-1 text-xs rounded ${
                                failedSave.retryCount === 0
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                  : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                              }`}
                            >
                              {failedSave.retryCount === 0
                                ? 'New'
                                : `${failedSave.retryCount} retries`}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {new Date(failedSave.timestamp).toLocaleString()}
                          </p>
                          <p className="text-xs text-red-600 dark:text-red-400">
                            {failedSave.error}
                          </p>
                        </div>

                        <div className="flex gap-1 ml-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRetryFailedSave(failedSave.id)}
                            disabled={isRetrying}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFailedSave(failedSave.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <ErrorBoundary>{renderDashboardContent()}</ErrorBoundary>
      </motion.div>

      {/* Route Type Selection Modal */}
      <RouteTypeModal
        isOpen={isRouteTypeModalOpen}
        onClose={() => setIsRouteTypeModalOpen(false)}
        onSelectSingle={handleSelectSingleTracking}
        onSelectJoint={handleSelectJointTracking}
      />

      {/* Route Tracking Modal */}
      <RouteTrackingModal
        isOpen={isRouteModalOpen}
        onClose={handleCloseRouteModal}
        onSaveRoute={handleSaveRoute}
        isJointTracking={isJointTrackingSelected}
        activities={activities}
      />

      {/* Screenshot Import Modal */}
      <ScreenshotImportModal
        isOpen={isScreenshotImportModalOpen}
        onClose={() => setIsScreenshotImportModalOpen(false)}
        onSaveActivity={handleSaveImportedActivity}
        userAddress={addressLower || ''}
        activities={activities}
      />

      {/* Steps Goal Celebration */}
      <CelebrationAnimation
        isOpen={showStepsCelebration}
        onClose={handleCloseStepsCelebration}
        achievementType="steps"
        achievementValue="10,000 steps"
        achievementTitle="Daily Steps Goal"
        description="Congratulations on reaching your daily steps goal!"
        showReward={false}
        onShare={handleShareStepsAchievement}
        showShareButton={!!addressLower}
      />

      {/* Streak Milestone Celebration */}
      <CelebrationAnimation
        isOpen={showStreakCelebration}
        onClose={handleCloseStreakCelebration}
        achievementType="streak"
        achievementValue={`${streakMilestone} days`}
        achievementTitle="Streak Milestone"
        description={`Congratulations on maintaining a ${streakMilestone}-day activity streak!`}
        showReward={false}
        onShare={handleShareStreakAchievement}
        showShareButton={!!addressLower}
      />
    </>
  );
}
