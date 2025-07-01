'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import { Bolt, Flame, Clock, Plus, RefreshCw, AlertTriangle, RotateCcw, X } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  addFailedSave,
  retryAllFailedSaves,
  retryFailedSave,
  removeFailedSave,
} from '@/lib/redux/slices/failedSavesSlice';
import { updateGoalProgress } from '@/lib/redux/slices/goalsSlice';
import { fetchProfile, updateProfile } from '@/lib/redux/slices/profileSlice';
import { createPost } from '@/lib/redux/slices/socialFeedSlice';
import { showSuccessToast, showInfoToast } from '@/lib/redux/slices/toastSlice';
import { IMeal } from '@/lib/supabase/meals';
import {
  generateAchievementPostContent,
  createAchievementData,
} from '@/utils/achievements/shareAchievement';
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

type NutrientType = 'calories' | 'protein' | 'carbohydrates' | 'fats' | 'fiber';

export function EnergyPage() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  // UI state
  const [refreshing, setRefreshing] = useState(false);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState(0);
  const [showFailedSavesDetails, setShowFailedSavesDetails] = useState(false);
  const [retryingFailedSaves, setRetryingFailedSaves] = useState<{ [key: string]: boolean }>({});
  const [selectedNutrient, setSelectedNutrient] = useState<NutrientType>('calories');

  // Modal states
  const [isMealLoggingTypeModalOpen, setIsMealLoggingTypeModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isTextMealModalOpen, setIsTextMealModalOpen] = useState(false);
  const [isMealSearchModalOpen, setIsMealSearchModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isMealResultsModalOpen, setIsMealResultsModalOpen] = useState(false);
  const [showLogMealConfirm, setShowLogMealConfirm] = useState(false);

  // Meal data states
  const [capturedImageData, setCapturedImageData] = useState<string | null>(null);
  const [mealToEdit, setMealToEdit] = useState<IMeal | null>(null);
  const [mealToLogConfirm, setMealToLogConfirm] = useState<IMeal | null>(null);
  const [mealResultsModalSourceType, setMealResultsModalSourceType] = useState<
    'camera' | 'text' | 'edit'
  >('camera');
  // Redux and app state
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = useMemo(() => address?.toLowerCase(), [address]);
  const currentDate = useMemo(() => new Date(), []);

  // Premium status
  const { usePremiumStatus } = useMovinEarn();
  const { isPremiumActive } = usePremiumStatus();
  const isPremium = isPremiumActive();

  // Redux store data
  const { energyEntries, isLoading, error } = useAppSelector((state) => state.energyData);
  const { profile } = useAppSelector((state) => state.profile);
  const { activities } = useAppSelector((state) => state.activityData);
  const { failedSaves } = useAppSelector((state) => state.failedSaves);

  // Computed nutrition data from energy entries
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

  // Get nutrient data and goals based on selected nutrient
  const getNutrientData = useMemo(() => {
    if (!dailyNutrition) {
      return {
        current: 0,
        goal: 0,
        unit: '',
        displayValue: '0',
        goalDisplay: '0',
        percentage: 0,
      };
    }

    switch (selectedNutrient) {
      case 'calories':
        return {
          current: dailyNutrition.calories,
          goal: dailyCalories.goal,
          unit: 'kcal',
          displayValue: Math.round(dailyNutrition.calories).toLocaleString(),
          goalDisplay: Math.round(dailyCalories.goal).toLocaleString(),
          percentage:
            dailyCalories.goal > 0 ? (dailyNutrition.calories / dailyCalories.goal) * 100 : 0,
        };
      case 'protein': {
        // Recommended protein: 1.6g per kg body weight or default 50g
        const proteinGoal = profile?.weight ? profile.weight * 1.6 : 50;
        return {
          current: dailyNutrition.protein,
          goal: proteinGoal,
          unit: 'g',
          displayValue: Math.round(dailyNutrition.protein).toString(),
          goalDisplay: Math.round(proteinGoal).toString(),
          percentage: proteinGoal > 0 ? (dailyNutrition.protein / proteinGoal) * 100 : 0,
        };
      }
      case 'carbohydrates': {
        // Recommended carbs: 45-65% of calories, using 50%
        const carbsGoal = (dailyCalories.goal * 0.5) / 4; // 4 calories per gram of carbs
        return {
          current: dailyNutrition.carbohydrates,
          goal: carbsGoal,
          unit: 'g',
          displayValue: Math.round(dailyNutrition.carbohydrates).toString(),
          goalDisplay: Math.round(carbsGoal).toString(),
          percentage: carbsGoal > 0 ? (dailyNutrition.carbohydrates / carbsGoal) * 100 : 0,
        };
      }
      case 'fats': {
        // Recommended fats: 20-35% of calories, using 30%
        const fatsGoal = (dailyCalories.goal * 0.3) / 9; // 9 calories per gram of fat
        return {
          current: dailyNutrition.fats,
          goal: fatsGoal,
          unit: 'g',
          displayValue: Math.round(dailyNutrition.fats).toString(),
          goalDisplay: Math.round(fatsGoal).toString(),
          percentage: fatsGoal > 0 ? (dailyNutrition.fats / fatsGoal) * 100 : 0,
        };
      }
      case 'fiber': {
        // Recommended fiber: 25-35g per day
        const fiberGoal = 30;
        return {
          current: dailyNutrition.fiber,
          goal: fiberGoal,
          unit: 'g',
          displayValue: Math.round(dailyNutrition.fiber).toString(),
          goalDisplay: fiberGoal.toString(),
          percentage: fiberGoal > 0 ? (dailyNutrition.fiber / fiberGoal) * 100 : 0,
        };
      }
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
  }, [dailyNutrition, selectedNutrient, dailyCalories, profile]);

  const handleNutrientClick = useCallback((nutrient: NutrientType) => {
    setSelectedNutrient(nutrient);
  }, []);

  // Initialize data on mount
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
      // First, retry any failed saves
      if (failedSaves.length > 0) {
        await dispatch(retryAllFailedSaves()).unwrap();
      }

      await dispatch(fetchEnergyData(addressLower)).unwrap();

      // Update goal progress after refreshing energy data
      try {
        await dispatch(updateGoalProgress({ address: addressLower })).unwrap();
      } catch (goalError) {
        console.error('Failed to update goal progress:', goalError);
        // Don't show error for goal updates as it's not critical
      }

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
    setMealToEdit(null);
    setMealResultsModalSourceType('camera');
    setIsMealResultsModalOpen(true);
    setIsCameraModalOpen(false);
  }, []);

  const handleTextMealAnalyze = useCallback((description: string) => {
    console.log('Text input for meal analysis:', description);
  }, []);

  const handleMealSelectedForLogging = useCallback(
    (meal: IMeal) => {
      if (!addressLower) return;
      setMealToLogConfirm(meal);
      setShowLogMealConfirm(true);
    },
    [addressLower],
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
      await dispatch(
        addEnergyEntry({ address: addressLower, energyData: energyEntryData }),
      ).unwrap();

      updateStreakCount();

      // Update goal progress after adding meal
      try {
        await dispatch(updateGoalProgress({ address: addressLower, category: 'daily' })).unwrap();
      } catch (goalError) {
        console.error('Failed to update goal progress:', goalError);
      }

      dispatch(
        showSuccessToast({
          title: 'Meal Added',
          description: `${mealToLogConfirm.meal_name} has been added to your log`,
        }),
      );
    } catch (error) {
      console.error('Failed to add meal for logging:', error);

      // Check if it's a network error and add to retry queue
      const isNetworkError =
        error instanceof Error &&
        (error.message.includes('network') ||
          error.message.includes('fetch') ||
          error.message.includes('NetworkError') ||
          error.name === 'NetworkError');

      if (isNetworkError) {
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

        dispatch(
          addFailedSave({
            type: 'add',
            dataType: 'meal',
            address: addressLower,
            mealData: energyEntryData,
            error: error.message,
          }),
        );

        dispatch(
          showInfoToast({
            title: 'Meal Queued for Retry',
            description:
              'Your meal will be saved when connection is restored. Check the refresh button to retry.',
          }),
        );
      } else {
        dispatch(showInfoToast({ title: 'Log Failed', description: 'Failed to log meal.' }));
      }
    } finally {
      resetLogMealConfirmState();
    }
  }, [mealToLogConfirm, addressLower, dispatch, updateStreakCount, resetLogMealConfirmState]);

  const handleEditMealRequest = useCallback((meal: IMeal) => {
    setMealToEdit(meal);
    setMealResultsModalSourceType('edit');
    setCapturedImageData(null);
    setIsMealSearchModalOpen(false);
    setIsMealResultsModalOpen(true);
  }, []);

  const handleCloseMealResultsModal = useCallback(() => {
    setIsMealResultsModalOpen(false);
    setCapturedImageData(null);
    setMealToEdit(null);
  }, []);

  const handleRetryLoadEnergy = useCallback(() => {
    if (!addressLower) return;

    dispatch(resetEnergyError());
    dispatch(fetchEnergyData(addressLower));
  }, [addressLower, dispatch]);

  const handleCloseStreakCelebration = useCallback(() => {
    setShowStreakCelebration(false);
  }, []);

  // Achievement sharing handler
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

  // Failed saves handlers
  const handleRetryIndividualFailedSave = useCallback(
    async (saveId: string) => {
      setRetryingFailedSaves((prev) => ({ ...prev, [saveId]: true }));
      try {
        const failedSave = failedSaves.find((save) => save.id === saveId);
        if (failedSave) {
          await dispatch(retryFailedSave(failedSave)).unwrap();
        }
      } catch (error) {
        console.error('Failed to retry save:', error);
      } finally {
        setRetryingFailedSaves((prev) => ({ ...prev, [saveId]: false }));
      }
    },
    [dispatch, failedSaves],
  );

  const handleRemoveFailedSave = useCallback(
    (saveId: string) => {
      dispatch(removeFailedSave(saveId));
    },
    [dispatch],
  );

  const handleToggleFailedSavesDetails = useCallback(() => {
    setShowFailedSavesDetails(!showFailedSavesDetails);
  }, [showFailedSavesDetails]);

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
                      key={selectedNutrient}
                    >
                      {getNutrientData.displayValue}
                    </motion.span>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ml-2`}>
                      / {getNutrientData.goalDisplay} {getNutrientData.unit}
                    </span>
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    <Progress value={getNutrientData.percentage} className="h-2 mt-3" />
                  </motion.div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-6">
                    <motion.div
                      className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors ${
                        selectedNutrient === 'calories'
                          ? 'bg-blue-500/20 ring-2 ring-blue-500/50'
                          : 'hover:bg-blue-500/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      onClick={() => handleNutrientClick('calories')}
                    >
                      <div className="bg-blue-500/10 p-2 rounded-full mb-2">
                        <Flame className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(dailyNutrition?.calories || 0)}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        kcal
                      </span>
                    </motion.div>

                    <motion.div
                      className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors ${
                        selectedNutrient === 'protein'
                          ? 'bg-green-500/20 ring-2 ring-green-500/50'
                          : 'hover:bg-green-500/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      onClick={() => handleNutrientClick('protein')}
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
                      className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors ${
                        selectedNutrient === 'carbohydrates'
                          ? 'bg-sky-500/20 ring-2 ring-sky-500/50'
                          : 'hover:bg-sky-500/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      onClick={() => handleNutrientClick('carbohydrates')}
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
                      className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors ${
                        selectedNutrient === 'fats'
                          ? 'bg-yellow-500/20 ring-2 ring-yellow-500/50'
                          : 'hover:bg-yellow-500/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      onClick={() => handleNutrientClick('fats')}
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
                      className={`flex flex-col items-center cursor-pointer p-2 rounded-lg transition-colors ${
                        selectedNutrient === 'fiber'
                          ? 'bg-purple-500/20 ring-2 ring-purple-500/50'
                          : 'hover:bg-purple-500/10'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                      onClick={() => handleNutrientClick('fiber')}
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
                    value={Math.round(getNutrientData.percentage)}
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
                  <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                    <Button variant="outline" onClick={handleOpenMealLogging}>
                      <Plus className="h-4 w-4 mr-2" />
                      Log Meal
                    </Button>
                    {failedSaves.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="text-amber-600 border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      >
                        {refreshing ? (
                          <div className="w-4 h-4 border border-amber-500 border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        Retry Failed Saves
                      </Button>
                    )}
                  </div>
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
            {/* Failed Saves Indicator */}
            {failedSaves.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleFailedSavesDetails}
                className="ml-2 h-8 px-2 border-amber-500 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                <span className="text-xs font-medium">{failedSaves.length}</span>
              </Button>
            )}
          </div>
        </motion.div>

        {/* Failed Saves Details */}
        {failedSaves.length > 0 && showFailedSavesDetails && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            variants={item}
          >
            <Card
              className={`${
                isDark ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-amber-700 dark:text-amber-300">
                    Pending Meal Saves ({failedSaves.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleFailedSavesDetails}
                    className="h-6 w-6 p-0 text-amber-600 dark:text-amber-400"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {failedSaves.map((save) => (
                    <div
                      key={save.id}
                      className={`p-3 rounded-lg ${
                        isDark ? 'bg-gray-800/50' : 'bg-white/70'
                      } flex items-center justify-between`}
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {save.dataType === 'meal'
                            ? save.mealData?.meal_name || 'Unknown Meal'
                            : 'Activity'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Failed: {new Date(save.timestamp).toLocaleString()} • Retries:{' '}
                          {save.retryCount}/5
                        </p>
                        {save.error && (
                          <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                            {save.error}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRetryIndividualFailedSave(save.id)}
                          disabled={retryingFailedSaves[save.id]}
                          className="h-8 px-3 text-blue-600 dark:text-blue-400"
                        >
                          {retryingFailedSaves[save.id] ? (
                            <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFailedSave(save.id)}
                          className="h-8 px-3 text-red-500 dark:text-red-400"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
          onSelectMeal={handleMealSelectedForLogging}
          onEditMeal={handleEditMealRequest}
          userAddress={addressLower}
        />
      )}

      {/* Meal Detection Results Modal - Only show for premium users */}
      {isPremium && (
        <MealDetectionResultsModal
          isOpen={isMealResultsModalOpen}
          onClose={handleCloseMealResultsModal}
          imageData={mealResultsModalSourceType === 'camera' ? capturedImageData : null}
          mealData={null}
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
                Are you sure you want to log &quot;{mealToLogConfirm?.meal_name}&quot;? This action
                is permanent.
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
        onShare={handleShareStreakAchievement}
        showShareButton={!!addressLower}
      />
    </>
  );
}
