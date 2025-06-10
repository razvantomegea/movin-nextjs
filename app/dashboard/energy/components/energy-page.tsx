'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import { Bolt, Flame, Clock, Camera, Plus, RefreshCw, PenTool } from 'lucide-react';
import { useTheme } from 'next-themes';
import { CameraModal } from '@/components/camera-modal';
import { CircularProgress } from '@/components/circular-progress';
import ErrorBoundary from '@/components/error-boundary';
import { MealLoggingTypeModal } from '@/components/meal-logging-type-modal';
import { MealSearchModal } from '@/components/meal-search-modal';
import { PremiumUpgradeModal } from '@/components/premium-upgrade-modal';
import { RefreshButton } from '@/components/refresh-button';
import { TextMealModal } from '@/components/text-meal-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Progress } from '@/components/ui/progress';
import { useMovinEarn } from '@/lib/hooks/useMovinEarn';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchEnergyData,
  resetEnergyError,
  addEnergyEntry,
} from '@/lib/redux/slices/energyDataSlice';
import { addMealToLibrary } from '@/lib/redux/slices/mealsSlice';
import { showSuccessToast, showInfoToast } from '@/lib/redux/slices/toastSlice';
import { IMeal } from '@/lib/supabase/meals';
import {
  mapEnergyToDaily,
  mapEnergyToWeekly,
  mapEnergyToMonthly,
  mapEnergyToYearly,
  mapEnergyToTodaysMeals,
  type DailyNutrition,
  type NutritionTimeRangeData,
  type TodaysMeal,
} from '@/utils/movin/energyMappers';
import { EnergyOverviewChart } from './energy-overview-chart';
import { EnergyPageSkeleton } from './energy-page-skeleton';
import { MealDetectionResultsModal } from './meal-detection-results-modal';

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
  const [isMealLoggingTypeModalOpen, setIsMealLoggingTypeModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isTextMealModalOpen, setIsTextMealModalOpen] = useState(false);
  const [isMealSearchModalOpen, setIsMealSearchModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isMealResultsModalOpen, setIsMealResultsModalOpen] = useState(false);
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = useMemo(() => address?.toLowerCase(), [address]);
  const currentDate = useMemo(() => new Date(), []);

  // Check if user has premium access
  const { usePremiumStatus } = useMovinEarn();
  const { isPremiumActive } = usePremiumStatus();
  const isPremium = isPremiumActive();

  // Get energy data from Redux store
  const { energyEntries, isLoading, error } = useAppSelector((state) => state.energyData);

  // Memoize derived data using energy mappers
  const dailyNutrition: DailyNutrition | null = useMemo(() => {
    if (energyEntries.length > 0) {
      return mapEnergyToDaily(energyEntries, currentDate);
    }
    return null;
  }, [energyEntries, currentDate]);

  const todaysMeals: TodaysMeal[] = useMemo(() => {
    return mapEnergyToTodaysMeals(energyEntries, currentDate);
  }, [energyEntries, currentDate]);

  const weeklyEnergyData: NutritionTimeRangeData[] = useMemo(() => {
    return mapEnergyToWeekly(energyEntries, currentDate);
  }, [energyEntries, currentDate]);

  const monthlyEnergyData: NutritionTimeRangeData[] = useMemo(() => {
    return mapEnergyToMonthly(energyEntries, currentDate);
  }, [energyEntries, currentDate]);

  const yearlyEnergyData: NutritionTimeRangeData[] = useMemo(() => {
    return mapEnergyToYearly(energyEntries, currentDate);
  }, [energyEntries, currentDate]);

  // Compute daily calories from daily nutrition data
  const dailyCalories = useMemo(() => {
    if (!dailyNutrition) {
      return {
        consumed: 0,
        goal: 2000,
        remaining: 2000,
      };
    }

    const goal = 2000; // Default goal, could be made configurable

    return {
      consumed: dailyNutrition.calories,
      goal,
      remaining: Math.max(0, goal - dailyNutrition.calories),
    };
  }, [dailyNutrition]);

  // Fetch data when component mounts (only for premium users)
  useEffect(() => {
    if (isPremium && addressLower) {
      dispatch(fetchEnergyData(addressLower));
    } else if (!isPremium) {
      // Show premium modal for non-premium users
      setIsPremiumModalOpen(true);
    }
  }, [dispatch, isPremium, addressLower]);

  const handleRefresh = async () => {
    if (!addressLower) return;

    setRefreshing(true);
    try {
      await dispatch(fetchEnergyData(addressLower)).unwrap();
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

  const handleOpenMealLogging = () => {
    setIsMealLoggingTypeModalOpen(true);
  };

  const handleSelectCamera = () => {
    setIsMealLoggingTypeModalOpen(false);
    setIsCameraModalOpen(true);
  };

  const handleSelectText = () => {
    setIsMealLoggingTypeModalOpen(false);
    setIsTextMealModalOpen(true);
  };

  const handleSelectSearch = () => {
    setIsMealLoggingTypeModalOpen(false);
    setIsMealSearchModalOpen(true);
  };

  const handleCameraCapture = async (imageData: string) => {
    // Store the captured image data and show the meal detection results modal
    setCapturedImageData(imageData);
    setIsMealResultsModalOpen(true);
  };

  const handleTextMealAnalyze = async (description: string) => {
    // This function is for backward compatibility
    // The actual meal saving is handled in the MealDetectionResultsModal
    console.log('Meal described:', description);
  };

  const handleMealSelected = async (meal: IMeal) => {
    if (!addressLower) return;

    try {
      // Create energy entry data from selected meal
      const energyEntryData = {
        address: addressLower,
        meal_name: meal.meal_name,
        calories: meal.calories,
        protein: meal.protein,
        carbohydrates: meal.carbohydrates,
        fats: meal.fats,
        log_date: new Date().toISOString().split('T')[0],
      };

      // Add the meal to energy log
      await dispatch(
        addEnergyEntry({ address: addressLower, energyData: energyEntryData }),
      ).unwrap();

      dispatch(
        showSuccessToast({
          title: 'Meal Added',
          description: `${meal.meal_name} has been added to your log`,
        }),
      );
    } catch (error) {
      console.error('Failed to add meal:', error);
      dispatch(
        showInfoToast({
          title: 'Save Failed',
          description: 'Failed to save meal to your log',
        }),
      );
    }
  };

  const handleRetryLoadEnergy = () => {
    if (!addressLower) return;

    dispatch(resetEnergyError());
    dispatch(fetchEnergyData(addressLower));
  };

  // Render the energy content
  const renderEnergyContent = () => {
    // If not premium, show upgrade modal instead of content
    if (!isPremium) {
      return null; // Modal will be shown separately
    }

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
                  <span className="text-sm font-medium">Today&apos;s Energy</span>
                </div>
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {dailyNutrition ? dailyNutrition.date : new Date().toLocaleDateString()}
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

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                        <Bolt className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">
                        {dailyNutrition?.protein.toFixed(1) || '0.0'}g
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        protein
                      </span>
                    </motion.div>

                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                        <Bolt className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">
                        {dailyNutrition?.carbohydrates.toFixed(1) || '0.0'}g
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        carbohydrates
                      </span>
                    </motion.div>

                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                        <Bolt className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">
                        {dailyNutrition?.fats.toFixed(1) || '0.0'}g
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        fats
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
            <h2 className="text-lg font-medium">Today&apos;s Meals</h2>
            <Button
              variant="outline"
              size="sm"
              className="text-blue-500 border-blue-500"
              onClick={handleOpenMealLogging}
            >
              <Plus className="h-4 w-4 mr-2" />
              Log Meal
            </Button>
          </div>
          <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
            <CardContent className="p-6">
              {todaysMeals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Flame className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No meals recorded today</p>
                  <Button variant="outline" className="mt-4" onClick={handleOpenMealLogging}>
                    <Plus className="h-4 w-4 mr-2" />
                    Log Meal
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
                          <div className="text-xs text-gray-500">Carbohydrates</div>
                          <div className="font-medium">{meal.carbohydrates}g</div>
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
      </div>
    );
  };

  return (
    <>
      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <motion.div className="flex items-center justify-between mb-6" variants={item}>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-2">Energy</h1>
            {isPremium && addressLower && (
              <RefreshButton onRefresh={handleRefresh} isLoading={isLoading || refreshing} />
            )}
          </div>
        </motion.div>

        <ErrorBoundary>{renderEnergyContent()}</ErrorBoundary>
      </motion.div>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={isPremiumModalOpen}
        onClose={() => setIsPremiumModalOpen(false)}
        featureName="Energy Tracking"
        title="Energy Tracking - Premium Feature"
        description="Track your meals, calories, and nutrition with AI-powered meal detection. Get detailed insights into your energy consumption and macronutrients."
      />

      {/* Meal Logging Type Selection Modal - Only show for premium users */}
      {isPremium && (
        <MealLoggingTypeModal
          isOpen={isMealLoggingTypeModalOpen}
          onClose={() => setIsMealLoggingTypeModalOpen(false)}
          onSelectCamera={handleSelectCamera}
          onSelectText={handleSelectText}
          onSelectSearch={handleSelectSearch}
        />
      )}

      {/* Camera Modal - Only show for premium users */}
      {isPremium && (
        <CameraModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onCapture={handleCameraCapture}
          title="Scan Meal"
          instruction="Position your meal in the frame and tap the capture button"
          confirmText="Confirm & Analyze"
        />
      )}

      {/* Text Meal Modal - Only show for premium users */}
      {isPremium && (
        <TextMealModal
          isOpen={isTextMealModalOpen}
          onClose={() => setIsTextMealModalOpen(false)}
          onAnalyze={handleTextMealAnalyze}
        />
      )}

      {/* Meal Search Modal - Only show for premium users */}
      {isPremium && addressLower && (
        <MealSearchModal
          isOpen={isMealSearchModalOpen}
          onClose={() => setIsMealSearchModalOpen(false)}
          onSelectMeal={handleMealSelected}
          userAddress={addressLower}
        />
      )}

      {/* Meal Detection Results Modal - Only show for premium users */}
      {isPremium && (
        <MealDetectionResultsModal
          isOpen={isMealResultsModalOpen}
          onClose={() => {
            setIsMealResultsModalOpen(false);
            setCapturedImageData(null);
          }}
          imageData={capturedImageData}
          sourceType="camera"
        />
      )}
    </>
  );
}
