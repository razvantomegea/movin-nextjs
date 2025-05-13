'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, Flame, TrendingUp, RefreshCw, Dumbbell, MapPin } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ActivityColumnChart } from '@/components/activity-column-chart';
import { CircularProgress } from '@/components/circular-progress';
import ErrorBoundary from '@/components/error-boundary';
import { RefreshButton } from '@/components/refresh-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Progress } from '@/components/ui/progress';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchActivityData, resetActivityError } from '@/lib/redux/slices/activityDataSlice';
import { resetJointTracking } from '@/lib/redux/slices/jointTrackingSlice';
import { saveRouteData } from '@/lib/redux/slices/routeDataSlice';
import { showSuccessToast, showInfoToast } from '@/lib/redux/slices/toastSlice';
import { formatDistance, formatDuration } from '@/utils';
import { ActivityDashboardSkeleton } from './activity-dashboard-skeleton';
import { RouteTrackingModal, type RouteData } from './route-tracking-modal';
import { RouteTypeModal } from './route-type-modal';

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
  const [refreshing, setRefreshing] = useState(false);
  const [isRouteTypeModalOpen, setIsRouteTypeModalOpen] = useState(false);
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

  const dispatch = useAppDispatch();

  // Get activity data from Redux store
  const { dailyActivity, weeklyData, monthlyData, yearlyData, todaysWorkouts, isLoading, error } =
    useAppSelector((state) => state.activityData);

  // Fetch data when component mounts
  useEffect(() => {
    dispatch(fetchActivityData());
  }, [dispatch]);

  // Clean up joint tracking when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetJointTracking());
    };
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchActivityData()).unwrap();
      dispatch(
        showSuccessToast({
          title: 'Data Refreshed',
          description: 'Your activity data has been updated',
        }),
      );
    } catch (error) {
      dispatch(
        showInfoToast({
          title: 'Refresh Failed',
          description: 'Please try again later',
        }),
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleRetryLoadActivity = () => {
    dispatch(resetActivityError());
    dispatch(fetchActivityData());
  };

  const handleSaveRoute = (routeData: RouteData) => {
    // Add the missing properties required by the Redux store
    const enhancedRouteData = {
      ...routeData,
      type: routeData.isJoint ? 'Joint Run' : 'Running',
      date: new Date().toISOString(),
      calories: Math.round(routeData.distance / 15), // Rough estimate: 1km ≈ 65 calories
    };

    dispatch(saveRouteData(enhancedRouteData));

    // In a real app, you would dispatch an action to add this workout
    // For now, we'll just show a toast
    dispatch(
      showSuccessToast({
        title: routeData.isJoint ? 'Joint Route Saved' : 'Route Saved',
        description: `${formatDistance(routeData.distance)} in ${formatDuration(
          routeData.duration,
        )}${routeData.isJoint ? ` with ${routeData.participants?.length || 0} participants` : ''}`,
      }),
    );

    // Reset joint tracking state
    if (routeData.isJoint) {
      dispatch(resetJointTracking());
    }
  };

  // Handle opening the route type modal
  const handleOpenRouteTracking = () => {
    setIsRouteTypeModalOpen(true);
  };

  // Handle selecting single route tracking
  const handleSelectSingleTracking = () => {
    setIsRouteTypeModalOpen(false);
    setIsRouteModalOpen(true);
  };

  // Handle selecting joint route tracking
  const handleSelectJointTracking = () => {
    setIsRouteTypeModalOpen(false);
    setIsRouteModalOpen(true);
  };

  // Handle closing the route modal
  const handleCloseRouteModal = () => {
    setIsRouteModalOpen(false);
    dispatch(resetJointTracking());
  };

  // Render the dashboard content
  const renderDashboardContent = () => {
    if (isLoading && !refreshing) {
      return <ActivityDashboardSkeleton />;
    }

    if (error) {
      return (
        <div className="space-y-4">
          <ErrorAlert message={error} />
          <Button onClick={handleRetryLoadActivity} className="w-full">
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
                  {dailyActivity.date}
                </span>
              </div>

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
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                      / 10,000 steps
                    </span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Progress value={(dailyActivity.steps / 10000) * 100} className="h-2 mt-3" />
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
                      <span className="text-sm font-medium">{dailyActivity.calories}</span>
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
                      <span className="text-sm font-medium">{dailyActivity.distance}</span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        km
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
                        {dailyActivity.activeMinutes % 60}m
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        active
                      </span>
                    </motion.div>
                  </div>
                </div>

                <div className="ml-6">
                  <CircularProgress
                    value={(dailyActivity.steps / 10000) * 100}
                    size={100}
                    strokeWidth={8}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Chart */}
        <motion.div className="space-y-4" variants={item}>
          <h2 className="text-lg font-medium">Activity Overview</h2>
          <ActivityColumnChart
            weeklyData={weeklyData}
            monthlyData={monthlyData}
            yearlyData={yearlyData}
          />
        </motion.div>

        {/* Today's Workouts */}
        <motion.div className="space-y-4" variants={item}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Today's Workouts</h2>
            <Button
              onClick={handleOpenRouteTracking}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Track Route
            </Button>
          </div>
          <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
            <CardContent className="p-6">
              {todaysWorkouts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No workouts recorded today</p>
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
                          <span className="mr-3">{workout.duration}</span>
                          {workout.distance && <span className="mr-3">{workout.distance}</span>}
                          <span>{workout.calories} kcal</span>
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
        <motion.div className="flex items-center justify-between mb-6" variants={item}>
          <h1 className="text-2xl font-bold">Activity</h1>
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
      />
    </>
  );
}
