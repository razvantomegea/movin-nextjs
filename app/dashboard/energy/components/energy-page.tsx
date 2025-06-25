'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import { Bolt, Flame, Clock, Plus, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { CameraModal } from '@/components/camera-modal';
import { CelebrationAnimation } from '@/components/celebration-animation';
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
import { fetchActivities } from '@/lib/redux/slices/activityDataSlice';
import {
  fetchEnergyData,
  resetEnergyError,
  addEnergyEntry,
} from '@/lib/redux/slices/energyDataSlice';
import { fetchProfile, updateProfile } from '@/lib/redux/slices/profileSlice';
import { showSuccessToast, showInfoToast } from '@/lib/redux/slices/toastSlice';
import { IMeal } from '@/lib/supabase/meals';
import { calculateBMR, calculateDailyCalories, calculateAge } from '@/utils/energy/calculateBMR';

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
  const [textAnalysisResult, setTextAnalysisResult] = useState<any | null>(null); // For text based analysis results
  const [mealToEdit, setMealToEdit] = useState<IMeal | null>(null); // For editing a meal
  const [mealResultsModalSourceType, setMealResultsModalSourceType] = useState<'camera' | 'text' | 'edit'>('camera');
  const [showLogMealConfirm, setShowLogMealConfirm] = useState(false); // For log confirmation
  const [mealToLogConfirm, setMealToLogConfirm] = useState<IMeal | null>(null); // Meal to log

  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState(0);
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
  const { profile } = useAppSelector((state) => state.profile);
  const { activities } = useAppSelector((state) => state.activityData);

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

    // Calculate BMR using Mifflin-St Jeor Equation
    const age = calculateAge(profile?.date_of_birth);
    const bmr = calculateBMR(profile?.weight, profile?.height, age, profile?.biological_sex);

    // Get activities from today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Filter activities for today
    const todaysActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.start_date);
      return activityDate >= todayStart && activityDate <= todayEnd;
    });

    // Calculate total calories burned today
    const caloriesBurnedToday = todaysActivities.reduce((total, activity) => {
      return total + (activity.total_energy_burned || 0);
    }, 0);

    // Apply activity factor (default to lightly active 1.2) and add today's burned calories
    const goal = calculateDailyCalories(bmr) + caloriesBurnedToday;

    return {
      consumed: dailyNutrition.calories,
      goal,
      remaining: Math.max(0, goal - dailyNutrition.calories),
    };
  }, [dailyNutrition, profile, activities]);

  // Fetch data when component mounts (only for premium users)
  useEffect(() => {
    if (isPremium && addressLower) {
      dispatch(fetchEnergyData(addressLower));
      dispatch(fetchProfile(addressLower));
      dispatch(fetchActivities(addressLower));
    } else if (!isPremium) {
      // Show premium modal for non-premium users
      setIsPremiumModalOpen(true);
    }
  }, [dispatch, isPremium, addressLower]);

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

  const updateStreakCount = useCallback(() => {
    if (!addressLower || !profile || (!activities && !energyEntries)) return;

    if (profile.last_streak_update) {
      const lastUpdate = new Date(profile.last_streak_update);
      const today = new Date();
      if (
        lastUpdate.getDate() === today.getDate() &&
        lastUpdate.getMonth() === today.getMonth() &&
        lastUpdate.getFullYear() === today.getFullYear()
      ) {
        return;
      }
    }

    const hasActivityYesterday = (activities || []).some((activity) =>
      isYesterday(new Date(activity.start_date)),
    );
    const hasMealYesterday = (energyEntries || []).some((entry) =>
      // Handle YYYY-MM-DD date format from energy log
      isYesterday(new Date(`${entry.log_date}T00:00:00`)),
    );
    const hasEventYesterday = hasActivityYesterday || hasMealYesterday;

    if (hasEventYesterday) {
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
      const milestones = [7, 30, 100, 365];
      if (milestones.includes(newStreakDays)) {
        setStreakMilestone(newStreakDays);
        setShowStreakCelebration(true);
      }
    } else {
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

  const handleOpenMealLogging = useCallback(() => {
    setIsMealLoggingTypeModalOpen(true);
  }, []);

  const handleSelectCamera = useCallback(() => {
    setIsMealLoggingTypeModalOpen(false);
    setIsCameraModalOpen(true);
  }, []);

  const handleSelectText = useCallback(() => {
    setIsMealLoggingTypeModalOpen(false);
    setIsTextMealModalOpen(true);
  }, []);

  const handleSelectSearch = useCallback(() => {
    setIsMealLoggingTypeModalOpen(false);
    setIsMealSearchModalOpen(true);
  }, []);

  const handleCameraCapture = useCallback(async (imageData: string) => {
    setCapturedImageData(imageData);
    setTextAnalysisResult(null); // Clear other sources
    setMealToEdit(null);
    setMealResultsModalSourceType('camera');
    setIsMealResultsModalOpen(true);
    setIsCameraModalOpen(false); // Close camera modal
  }, []);

  // This should be called when TextMealModal provides the analyzed data (currently it doesn't directly)
  // For now, let's assume TextMealModal's onAnalyze will eventually provide data to open MealDetectionResultsModal
  const handleTextMealAnalysisComplete = useCallback((analyzedMealData: any) => {
    // This function would be called if TextMealModal itself doesn't open MealDetectionResultsModal
    // but provides data back to this page to then open it.
    // The current TextMealModal seems to handle its own analysis and might directly call an API.
    // For now, let's assume it will set a state that triggers MealDetectionResultsModal
    setCapturedImageData(null); // Clear other sources
    setTextAnalysisResult(analyzedMealData);
    setMealToEdit(null);
    setMealResultsModalSourceType('text');
    setIsMealResultsModalOpen(true);
    setIsTextMealModalOpen(false); // Close text modal
  }, []);

  // Placeholder for TextMealModal's onAnalyze if it needs to trigger results modal from here
  // The current TextMealModal's onAnalyze prop is just console logging.
  // If TextMealModal is to use MealDetectionResultsModal, its onAnalyze should call something like handleTextMealAnalysisComplete.
  // For now, the `textAnalysisResult` state and `handleTextMealAnalysisComplete` are prepared for that integration.
  const handleTextMealAnalyzeProp = useCallback(async (description: string) => {
    console.log('Text input for meal analysis:', description);
    // Here, you would typically call an API to analyze the text, then:
    // const analysisData = await api.analyzeText(description);
    // handleTextMealAnalysisComplete(analysisData);
    // For demonstration, let's simulate this by passing the description as mealData
    // This assumes MealDetectionResultsModal can handle a raw description or that an API call happens before it.
    // The current structure of MealDetectionResultsModal expects ApiMealData.
    // So, TextMealModal should ideally perform the analysis and then pass structured data.
    // For now, we'll set a placeholder that it's text type.
    setTextAnalysisResult({ mealName: description, ingredients: [] }); // Placeholder structure
    setCapturedImageData(null);
    setMealToEdit(null);
    setMealResultsModalSourceType('text');
    setIsMealResultsModalOpen(true);
    setIsTextMealModalOpen(false);
  }, []);


  const handleMealSelectedForLogging = useCallback(
    (meal: IMeal) => { // No longer async, just sets state to show dialog
      if (!addressLower) return;
      setMealToLogConfirm(meal);
      setShowLogMealConfirm(true);
      // MealSearchModal's onSelectMeal calls its own onClose, so it should close.
    },
    [addressLower], // Removed dependencies that are now in executeLogMeal
  );

  const resetLogMealConfirmState = useCallback(() => {
    setShowLogMealConfirm(false);
    setMealToLogConfirm(null);
  }, []);

  const executeLogMeal = useCallback(async () => {
    if (!mealToLogConfirm || !addressLower) {
      resetLogMealConfirmState();
      return;
    }
    try {
      const energyEntryData = {
        address: addressLower,
        meal_name: mealToLogConfirm.meal_name,
        calories: mealToLogConfirm.calories,
        protein: mealToLogConfirm.protein,
        carbohydrates: mealToLogConfirm.carbohydrates,
        fats: mealToLogConfirm.fats,
        fiber: mealToLogConfirm.fiber || 0,
        log_date: new Date().toISOString().split('T')[0],
      };
      await dispatch(addEnergyEntry({ address: addressLower, energyData: energyEntryData })).unwrap();
      updateStreakCount(); // Make sure updateStreakCount is defined and stable if not in deps
      dispatch(
        showSuccessToast({
          title: 'Meal Added',
          description: `${mealToLogConfirm.meal_name} has been added to your log`,
        }),
      );
    } catch (error) {
      console.error('Failed to add meal for logging:', error);
      dispatch(showInfoToast({ title: 'Log Failed', description: 'Failed to log meal.' }));
    } finally {
      resetLogMealConfirmState();
    }
  }, [mealToLogConfirm, addressLower, dispatch, updateStreakCount, resetLogMealConfirmState]);


  const handleEditMealRequest = useCallback((meal: IMeal) => {
    setMealToEdit(meal);
    setMealResultsModalSourceType('edit');
    setCapturedImageData(null); // Clear other sources
    setTextAnalysisResult(null);
    setIsMealSearchModalOpen(false); // Close search modal
    setIsMealResultsModalOpen(true); // Open results modal in edit mode
  }, []);

  const handleCloseMealResultsModal = useCallback(() => {
    setIsMealResultsModalOpen(false);
    setCapturedImageData(null);
    setTextAnalysisResult(null);
    setMealToEdit(null);
    // Optionally reset mealResultsModalSourceType to a default, e.g., 'camera'
    // setMealResultsModalSourceType('camera');
  }, []);

  const handleRetryLoadEnergy = useCallback(() => {
    if (!addressLower) return;

    dispatch(resetEnergyError());
    dispatch(fetchEnergyData(addressLower));
  }, [addressLower, dispatch]);

  const handleCloseStreakCelebration = useCallback(() => {
    setShowStreakCelebration(false);
  }, []);

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
                      {Math.round(dailyCalories.consumed).toLocaleString()}
                    </motion.span>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                      / {Math.round(dailyCalories.goal).toLocaleString()} kcal
                    </span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Progress
                      value={
                        dailyCalories.goal > 0
                          ? (dailyCalories.consumed / dailyCalories.goal) * 100
                          : 0
                      }
                      className="h-2 mt-3"
                    />
                  </motion.div>

                  <div className="grid grid-cols-4 gap-4 mt-6">
                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-green-500/10 p-2 rounded-full mb-2">
                        <Bolt className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(dailyNutrition?.protein || 0)}g
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
                      <div className="bg-sky-500/10 p-2 rounded-full mb-2">
                        <Bolt className="h-4 w-4 text-sky-500" />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(dailyNutrition?.carbohydrates || 0)}g
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        carbs
                      </span>
                    </motion.div>

                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-yellow-500/10 p-2 rounded-full mb-2">
                        <Bolt className="h-4 w-4 text-yellow-500" />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(dailyNutrition?.fats || 0)}g
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        fats
                      </span>
                    </motion.div>

                    <motion.div
                      className="flex flex-col items-center"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                    >
                      <div className="bg-purple-500/10 p-2 rounded-full mb-2">
                        <Bolt className="h-4 w-4 text-purple-500" />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(dailyNutrition?.fiber || 0)}g
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        fiber
                      </span>
                    </motion.div>
                  </div>
                </div>

                <div className="ml-6">
                  <CircularProgress
                    value={Math.round((dailyCalories.consumed / dailyCalories.goal) * 100)}
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
                        <span className="font-bold text-blue-500">
                          {Math.round(meal.calories)} kcal
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 mt-3">
                        <div className="text-center p-1 bg-sky-500/10 rounded">
                          <div className="text-xs text-gray-500">Carbs</div>
                          <div className="font-medium">{Math.round(meal.carbohydrates)}g</div>
                        </div>
                        <div className="text-center p-1 bg-yellow-500/10 rounded">
                          <div className="text-xs text-gray-500">Fats</div>
                          <div className="font-medium">{Math.round(meal.fats)}g</div>
                        </div>
                        <div className="text-center p-1 bg-green-500/10 rounded">
                          <div className="text-xs text-gray-500">Protein</div>
                          <div className="font-medium">{Math.round(meal.protein)}g</div>
                        </div>
                        <div className="text-center p-1 bg-purple-500/10 rounded">
                          <div className="text-xs text-gray-500">Fiber</div>
                          <div className="font-medium">{Math.round(meal.fiber)}g</div>
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
          onAnalyze={handleTextMealAnalyzeProp} // Updated to use the new handler
        />
      )}

      {/* Meal Search Modal - Only show for premium users */}
      {isPremium && addressLower && (
        <MealSearchModal
          isOpen={isMealSearchModalOpen}
          onClose={() => setIsMealSearchModalOpen(false)}
          onSelectMeal={handleMealSelectedForLogging} // For logging
          onEditMeal={handleEditMealRequest} // For editing
          userAddress={addressLower}
        />
      )}

      {/* Meal Detection Results Modal - Only show for premium users */}
      {isPremium && (
        <MealDetectionResultsModal
          isOpen={isMealResultsModalOpen}
          onClose={handleCloseMealResultsModal}
          imageData={mealResultsModalSourceType === 'camera' ? capturedImageData : null}
          // mealData prop is used for text analysis results or pre-filling for edit.
          // The structure of mealData for 'text' source depends on what analyze-meal-text API returns
          // or how TextMealModal prepares it.
          // For 'edit', initialMealData is used directly.
          mealData={mealResultsModalSourceType === 'text' ? textAnalysisResult : null}
          initialMealData={mealResultsModalSourceType === 'edit' ? mealToEdit : null}
          isEditing={mealResultsModalSourceType === 'edit'}
          sourceType={mealResultsModalSourceType}
        />
      )}

      {/* Confirmation Dialog for Logging Meal */}
      {mealToLogConfirm && (
          <AlertDialog open={showLogMealConfirm} onOpenChange={setShowLogMealConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Log Meal</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log &quot;{mealToLogConfirm?.meal_name}&quot;? This
                  action is permanent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={resetLogMealConfirmState}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={executeLogMeal}>Log Meal</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

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
