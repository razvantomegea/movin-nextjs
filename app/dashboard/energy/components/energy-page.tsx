'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bolt, Flame, Clock, Utensils, Camera, Plus, RefreshCw } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { CircularProgress } from '@/components/circular-progress';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { EnergyOverviewChart } from './energy-overview-chart';
import { CameraModal } from '@/components/camera-modal';
import { showSuccessToast, showInfoToast } from '@/lib/redux/slices/toastSlice';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchEnergyData, resetEnergyError } from '@/lib/redux/slices/energyDataSlice';
import { EnergyPageSkeleton } from './energy-page-skeleton';
import { ErrorAlert } from '@/components/ui/error-alert';
import ErrorBoundary from '@/components/error-boundary';
import { RefreshButton } from '@/components/refresh-button';

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

export function EnergyPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const dispatch = useAppDispatch();

  // Get energy data from Redux store
  const {
    dailyCalories,
    weeklyEnergyData,
    monthlyEnergyData,
    yearlyEnergyData,
    todaysMeals,
    isLoading,
    error,
  } = useAppSelector((state) => state.energyData);

  // Fetch data when component mounts
  useEffect(() => {
    dispatch(fetchEnergyData());
  }, [dispatch]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchEnergyData()).unwrap();
      dispatch(
        showSuccessToast({
          title: 'Energy Data Refreshed',
          description: 'Your energy and nutrition data has been updated',
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

  const handleCameraCapture = async (imageData: string) => {
    // This function is still needed for backward compatibility
    // but the actual meal saving is now handled in the MealDetectionResultsModal
    console.log('Image captured, analysis will be handled in the results modal');
  };

  const handleRetryLoadEnergy = () => {
    dispatch(resetEnergyError());
    dispatch(fetchEnergyData());
  };

  // Render the energy content
  const renderEnergyContent = () => {
    if (isLoading && !refreshing) {
      return <EnergyPageSkeleton />;
    }

    if (error) {
      return (
        <div className="space-y-4">
          <ErrorAlert message={error} />
          <Button onClick={handleRetryLoadEnergy} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Daily Calories Card */}
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
                    <Flame className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium">Today's Calories</span>
                </div>
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
                      {dailyCalories.consumed.toLocaleString()}
                    </motion.span>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                      / {dailyCalories.goal.toLocaleString()} kcal
                    </span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Progress
                      value={(dailyCalories.consumed / dailyCalories.goal) * 100}
                      className="h-2 mt-3"
                    />
                  </motion.div>

                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                        <Bolt className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">{dailyCalories.remaining}</span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        remaining
                      </span>
                    </motion.div>

                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-green-500/10 p-2 rounded-full mb-2">
                        <Utensils className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-sm font-medium">{dailyCalories.breakfast}</span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        breakfast
                      </span>
                    </motion.div>

                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-orange-500/10 p-2 rounded-full mb-2">
                        <Utensils className="h-4 w-4 text-orange-500" />
                      </div>
                      <span className="text-sm font-medium">{dailyCalories.lunch}</span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        lunch
                      </span>
                    </motion.div>

                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-purple-500/10 p-2 rounded-full mb-2">
                        <Utensils className="h-4 w-4 text-purple-500" />
                      </div>
                      <span className="text-sm font-medium">{dailyCalories.dinner}</span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        dinner
                      </span>
                    </motion.div>
                  </div>
                </div>

                <div className="ml-6">
                  <CircularProgress
                    value={(dailyCalories.consumed / dailyCalories.goal) * 100}
                    size={100}
                    strokeWidth={8}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Energy Overview Chart */}
        <motion.div className="space-y-4" variants={item}>
          <h2 className="text-lg font-medium">Energy Overview</h2>
          <EnergyOverviewChart
            weeklyData={weeklyEnergyData}
            monthlyData={monthlyEnergyData}
            yearlyData={yearlyEnergyData}
          />
        </motion.div>

        {/* Today's Meals */}
        <motion.div className="space-y-4" variants={item}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Today's Meals</h2>
            <Button variant="outline" size="sm" className="text-blue-500 border-blue-500">
              <Plus className="h-4 w-4 mr-2" />
              Add Meal
            </Button>
          </div>
          <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
            <CardContent className="p-6">
              {todaysMeals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Utensils className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No meals recorded today</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsCameraModalOpen(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Scan a Meal
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {todaysMeals.map((meal, i) => (
                    <motion.div
                      key={meal.id}
                      className={`p-4 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100/70'} rounded-lg`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">{meal.name}</h3>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {meal.time}
                          </div>
                        </div>
                        <span className="font-bold text-blue-500">{meal.calories} kcal</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-3">
                        <div className="text-center p-1 bg-blue-500/10 rounded">
                          <div className="text-xs text-gray-500">Carbs</div>
                          <div className="font-medium">{meal.carbs}g</div>
                        </div>
                        <div className="text-center p-1 bg-yellow-500/10 rounded">
                          <div className="text-xs text-gray-500">Fats</div>
                          <div className="font-medium">{meal.fats}g</div>
                        </div>
                        <div className="text-center p-1 bg-green-500/10 rounded">
                          <div className="text-xs text-gray-500">Protein</div>
                          <div className="font-medium">{meal.protein}g</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Meal Detection Info Card */}
        <motion.div variants={item}>
          <Card
            className={`${isDark ? 'bg-blue-900/20' : 'bg-blue-50'} border ${
              isDark ? 'border-blue-800' : 'border-blue-100'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start">
                <div className="bg-blue-500/20 p-2 rounded-full mr-3 mt-1">
                  <Camera className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-600 dark:text-blue-400">Meal Detection</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    Take a photo of your meal and our AI will automatically detect ingredients,
                    calories, and macros. Just tap the "Scan Meal" button to get started.
                  </p>
                  <Button
                    className="mt-3 bg-blue-500 hover:bg-blue-600"
                    onClick={() => setIsCameraModalOpen(true)}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Scan Meal
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  };

  return (
    <>
      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <motion.div className="flex items-center justify-between mb-6" variants={item}>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-2">Energy</h1>
            <RefreshButton onRefresh={handleRefresh} isLoading={isLoading || refreshing} />
          </div>
          <Button
            onClick={() => setIsCameraModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Camera className="h-4 w-4 mr-2" />
            Scan Meal
          </Button>
        </motion.div>

        <ErrorBoundary>{renderEnergyContent()}</ErrorBoundary>
      </motion.div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onCapture={handleCameraCapture}
      />
    </>
  );
}
