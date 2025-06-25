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
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchActivities,
  addActivities,
  updateActivityData,
} from '@/lib/redux/slices/activityDataSlice';
import { fetchEnergyData } from '@/lib/redux/slices/energyDataSlice';
import { resetJointTracking } from '@/lib/redux/slices/jointTrackingSlice';
import { fetchProfile, updateProfile } from '@/lib/redux/slices/profileSlice';
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
  findExistingStepsActivity,
  mergeStepsActivities,
  type DailyActivity,
  type Workout,
  type TimeRangeData,
  getTodayDate,
} from '@/utils';
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
  const currentDate = useMemo(() => new Date(), []);
  const { address } = useAppKitAccount();
  const addressLower = useMemo(() => address?.toLowerCase(), [address]);

  const dispatch = useAppDispatch();

  const { activities, isLoading, error } = useAppSelector((state: RootState) => state.activityData);
  const { energyEntries } = useAppSelector((state: RootState) => state.energyData);
  const { profile } = useAppSelector((state: RootState) => state.profile);

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
    await dispatch(fetchActivities(addressLower)).unwrap();
    await dispatch(fetchProfile(addressLower)).unwrap();
    await dispatch(fetchEnergyData(addressLower)).unwrap();
    setRefreshing(false);
  }, [addressLower, dispatch]);

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
      dispatch(
        showInfoToast({
          title: 'Failed to Save Activity',
          description: 'Please try again later.',
        }),
      );
      // Log the error for debugging
      console.error('Failed to save activity:', error);
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

      // Check if this is a Steps activity and if there's an existing one for today
      const isStepsActivity = activityWithAddress.name === 'Steps';

      if (isStepsActivity) {
        const today = new Date();
        const existingStepsActivity = findExistingStepsActivity(activities, today);

        if (existingStepsActivity) {
          // Merge with existing Steps activity
          const mergedActivity = mergeStepsActivities(existingStepsActivity, activityWithAddress);

          // Update the existing activity
          await dispatch(updateActivityData(mergedActivity)).unwrap();

          dispatch(
            showSuccessToast({
              title: 'Steps Activity Updated',
              description: `Your daily steps have been updated to ${mergedActivity.total_steps?.toLocaleString()} steps.`,
            }),
          );
          return;
        }
      }

      // For new activities or non-Steps activities, add as new
      await dispatch(
        addActivities({ address: addressLower, activityData: [activityWithAddress] }),
      ).unwrap();

      dispatch(
        showSuccessToast({
          title: 'Workout Imported Successfully',
          description: `${activityWithAddress.name} workout has been added to your profile.`,
        }),
      );

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
      dispatch(
        showInfoToast({
          title: 'Failed to Import Workout',
          description: 'Please try again later.',
        }),
      );
      // Log the error for debugging
      console.error('Failed to save imported activity:', error);
    }
  };

  const handleCloseStepsCelebration = useCallback(() => {
    setShowStepsCelebration(false);
  }, []);

  const handleCloseStreakCelebration = useCallback(() => {
    setShowStreakCelebration(false);
  }, []);

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
                        >
                          {dailyActivity.steps.toLocaleString()}
                        </motion.span>
                        <span
                          className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}
                        >
                          / 10,000 steps
                        </span>
                      </div>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                      >
                        <Progress
                          value={Math.min((dailyActivity.steps / 10000) * 100, 100)}
                          className="h-2 mt-3"
                        />
                      </motion.div>

                      <div className="grid grid-cols-3 gap-4 mt-6">
                        <motion.div
                          className="flex flex-col items-center"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        >
                          <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                            <Flame className="h-4 w-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium">
                            {dailyActivity.calories.toLocaleString()}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            kcal
                          </span>
                        </motion.div>

                        <motion.div
                          className="flex flex-col items-center"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        >
                          <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium">
                            {dailyActivity.distance.toLocaleString()} km
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            distance
                          </span>
                        </motion.div>

                        <motion.div
                          className="flex flex-col items-center"
                          whileHover={{ scale: 1.05 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                        >
                          <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                            <Clock className="h-4 w-4 text-blue-500" />
                          </div>
                          <span className="text-sm font-medium">
                            {Math.floor(dailyActivity.activeMinutes / 60)}h{' '}
                            {Math.round(dailyActivity.activeMinutes % 60)}m
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            active
                          </span>
                        </motion.div>
                      </div>
                    </div>

                    <div className="ml-6">
                      <CircularProgress
                        value={Math.round((dailyActivity.steps / 10000) * 100)}
                        size={100}
                        strokeWidth={8}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Today&apos;s Workouts</h2>
            <div className="flex gap-2">
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
                <div className="text-center py-8 text-gray-500">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No workouts recorded today</p>
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
      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <motion.div className="flex items-center mb-6" variants={item}>
          <h1 className="text-2xl font-bold mr-2">Activities</h1>
          {/* Conditionally render the refresh button */}
          {<RefreshButton onRefresh={handleRefresh} isLoading={isLoading || refreshing} />}
        </motion.div>

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
      />

      {/* Screenshot Import Modal */}
      <ScreenshotImportModal
        isOpen={isScreenshotImportModalOpen}
        onClose={() => setIsScreenshotImportModalOpen(false)}
        onSaveActivity={handleSaveImportedActivity}
        userAddress={addressLower || ''}
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
      />
    </>
  );
}
