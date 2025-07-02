'use client';

import { useEffect, useMemo, useCallback, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { RefreshButton } from '@/components/refresh-button';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import {
  fetchGoals,
  updateGoalAsync,
  updateGoalProgress,
  type Goal,
} from '@/lib/redux/slices/goalsSlice';
import { createPost } from '@/lib/redux/slices/socialFeedSlice';
import { showSuccessToast, showInfoToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { getActivities, type IActivity } from '@/lib/supabase/activities';
import { getEnergyEntries, type IEnergy } from '@/lib/supabase/energy';
import { getProfile, type IProfile } from '@/lib/supabase/profile';
import {
  createAchievementData,
  generateAchievementPostContent,
} from '@/utils/achievements/shareAchievement';
import {
  calculateProgressEstimation,
  calculateCalorieBasedWeightProgress,
  formatEstimationText,
  type ProgressEstimation,
} from '@/utils/goals/progressCalculations';
import { EditGoalModal } from './edit-goal-modal';
import { GoalCardWithEstimation } from './goal-card-with-estimation';
import { GoalsPageSkeleton } from './goals-page-skeleton';

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

export function GoalsPage() {
  const dispatch = useAppDispatch();
  const { address } = useAppKitAccount();
  const addressLower = useMemo(() => address?.toLowerCase(), [address]);
  const { goals, loading, error, lastUpdated } = useAppSelector((state) => state.goals);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Additional data for progress calculations
  const [energyEntries, setEnergyEntries] = useState<IEnergy[]>([]);
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [profile, setProfile] = useState<IProfile | null>(null);
  const [progressEstimations, setProgressEstimations] = useState<
    Record<string, ProgressEstimation>
  >({});

  // Fetch additional data for progress calculations
  const fetchAdditionalData = useCallback(async () => {
    if (!addressLower) return;

    try {
      const [energyData, activitiesData, profileData] = await Promise.all([
        getEnergyEntries({ address: addressLower }),
        getActivities({ address: addressLower }),
        getProfile({ address: addressLower }),
      ]);

      setEnergyEntries(energyData);
      setActivities(activitiesData);
      setProfile(profileData);
    } catch (error) {
      console.error('Failed to fetch additional data for progress calculations:', error);
      dispatch(
        showErrorToast({
          title: 'Progress Data Error',
          description: 'Failed to load progress data. Some goal estimations may be unavailable.',
        }),
      );
    }
  }, [addressLower, dispatch]);

  // Calculate progress estimations for all goals
  const calculateGoalEstimations = useCallback(async () => {
    if (!goals.length || !addressLower) {
      setProgressEstimations({});
      return;
    }

    const estimations: Record<string, ProgressEstimation> = {};

    for (const goal of goals) {
      try {
        let calorieBasedProgress;

        // Calculate calorie-based progress for weight goals
        if (goal.goalType === 'weight' && profile?.weight && energyEntries.length > 0) {
          const goalStartDate = new Date(goal.createdAt); // Use createdAt as the start date
          calorieBasedProgress = await calculateCalorieBasedWeightProgress(
            goalStartDate,
            profile.weight,
            goal.targetValue,
            energyEntries,
            activities,
            profile,
          );
        }

        const estimation = calculateProgressEstimation(
          goal.currentValue,
          goal.targetValue,
          goal.category,
          goal.createdAt, // Use createdAt as the start date
          calorieBasedProgress,
        );

        estimations[goal.id] = estimation;
      } catch (error) {
        console.error(`Failed to calculate estimation for goal ${goal.id}:`, error);
      }
    }

    setProgressEstimations(estimations);
  }, [goals, profile, energyEntries, activities, addressLower]);

  useEffect(() => {
    // Fetch goals on component mount if user is connected
    if (addressLower) {
      dispatch(fetchGoals(addressLower));
      fetchAdditionalData();
    }
  }, [dispatch, addressLower, fetchAdditionalData]);

  useEffect(() => {
    // Calculate progress estimations when goals or related data changes
    calculateGoalEstimations();
  }, [calculateGoalEstimations]);

  useEffect(() => {
    // Show error toast if there's an error
    if (error) {
      dispatch(
        showErrorToast({
          title: 'Error',
          description: error,
        }),
      );
    }
  }, [error, dispatch]);

  const handleRefresh = async () => {
    if (!addressLower) return;

    try {
      await Promise.all([dispatch(fetchGoals(addressLower)).unwrap(), fetchAdditionalData()]);
      dispatch(
        showSuccessToast({
          title: 'Goals Refreshed',
          description: 'Your goals data has been updated',
        }),
      );
    } catch (error) {
      dispatch(
        showInfoToast({
          title: 'Refresh Failed',
          description: 'Please try again later',
        }),
      );
    }
  };

  // Handler to recalculate nutrition goals based on current weight and weight goal
  const handleRecalculateNutritionGoals = async () => {
    if (!addressLower) return;

    try {
      // Trigger goal progress update which will also update nutrition goals
      await dispatch(updateGoalProgress({ address: addressLower, category: 'daily' })).unwrap();

      // Refresh goals to get updated values
      await dispatch(fetchGoals(addressLower)).unwrap();

      dispatch(
        showSuccessToast({
          title: 'Nutrition Goals Recalculated',
          description:
            'Your nutrition goals have been updated based on your current weight and weight goal',
        }),
      );
    } catch (error) {
      dispatch(
        showInfoToast({
          title: 'Recalculation Failed',
          description: 'Please try again later',
        }),
      );
    }
  };

  // Handle opening the edit modal
  const handleEditGoal = useCallback((goal: Goal) => {
    setEditingGoal(goal);
    setIsEditModalOpen(true);
  }, []);

  // Handle closing the edit modal
  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingGoal(null);
  }, []);

  // Handle saving the edited goal
  const handleSaveGoal = useCallback(
    async (goalData: {
      target_value: number;
      title: string;
      icon: string;
      auto_trigger: boolean;
    }) => {
      if (!addressLower || !editingGoal) return;

      try {
        await dispatch(
          updateGoalAsync({
            id: editingGoal.id,
            address: addressLower,
            goalData,
          }),
        ).unwrap();

        // If this is a weight goal update, trigger nutrition goals recalculation
        if (editingGoal.goalType === 'weight') {
          try {
            // Trigger nutrition goals update on backend via goal progress update
            await dispatch(
              updateGoalProgress({ address: addressLower, category: 'daily' }),
            ).unwrap();

            dispatch(
              showSuccessToast({
                title: 'Goals Updated',
                description: 'Your weight goal and nutrition goals have been updated automatically',
              }),
            );
          } catch (nutritionError) {
            console.error('Failed to update nutrition goals:', nutritionError);
            dispatch(
              showSuccessToast({
                title: 'Goal Updated',
                description: 'Weight goal updated. Nutrition goals will sync on next refresh.',
              }),
            );
          }
        } else {
          dispatch(
            showSuccessToast({
              title: 'Goal Updated',
              description: 'Your goal has been successfully updated',
            }),
          );
        }

        handleCloseEditModal();

        // Refresh goals to show updated values
        if (addressLower) {
          dispatch(fetchGoals(addressLower));
        }
      } catch (error) {
        dispatch(
          showErrorToast({
            title: 'Update Failed',
            description: 'Failed to update goal. Please try again.',
          }),
        );
      }
    },
    [addressLower, editingGoal, dispatch, handleCloseEditModal],
  );

  // Achievement sharing handler
  const handleShareGoalAchievement = useCallback(
    async (goalType: string, goalValue: string, goalTitle: string, goalUnit: string) => {
      if (!addressLower) return;

      try {
        // Map goal types to achievement types
        const achievementTypeMap: Record<string, 'steps' | 'workout' | 'streak' | 'level'> = {
          steps: 'steps',
          calories: 'workout',
          calories_burned: 'workout',
          protein: 'workout',
          carbohydrates: 'workout',
          fats: 'workout',
          fiber: 'workout',
          weight: 'level',
          fitness: 'workout',
          duration: 'workout',
          mets: 'workout',
        };

        const achievementType = achievementTypeMap[goalType] || 'workout';

        const achievementData = createAchievementData(
          achievementType,
          `${goalValue} ${goalUnit}`,
          goalTitle,
          `Congratulations on achieving your ${goalTitle.toLowerCase()} goal!`,
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
            description: 'Your goal achievement has been shared with your connections.',
          }),
        );
      } catch (error) {
        console.error('Failed to share goal achievement:', error);
        dispatch(
          showErrorToast({
            title: 'Share Failed',
            description: 'Unable to share achievement. Please try again.',
          }),
        );
      }
    },
    [addressLower, dispatch],
  );

  // Function to validate/transform icon string to valid type
  const getValidIcon = (icon: string): 'steps' | 'workout' | 'streak' | 'level' => {
    return (['steps', 'workout', 'streak', 'level'].includes(icon) ? icon : 'steps') as
      | 'steps'
      | 'workout'
      | 'streak'
      | 'level';
  };

  // Group goals by category
  const dailyGoals = goals.filter((goal) => goal.category === 'daily');
  const weeklyGoals = goals.filter((goal) => goal.category === 'weekly');
  const monthlyGoals = goals.filter((goal) => goal.category === 'monthly');

  // Show skeleton while loading initially
  if (loading && !lastUpdated) {
    return <GoalsPageSkeleton />;
  }

  // Show error state if there's an error and no cached data
  if (error && !lastUpdated) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to load goals</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Button onClick={() => addressLower && dispatch(fetchGoals(addressLower))}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Show empty state if user is not connected
  if (!addressLower) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-gray-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Please connect your wallet to view and manage your goals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
        <motion.div className="mb-6" variants={item}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <h1 className="text-2xl font-bold mr-2">Your Goals</h1>
                <RefreshButton onRefresh={handleRefresh} isLoading={loading} />
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Track your progress and earn rewards
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculateNutritionGoals}
              disabled={loading}
              className="text-blue-500 border-blue-500"
            >
              Recalculate Nutrition Goals
            </Button>
          </div>
        </motion.div>

        <div className="space-y-6">
          {dailyGoals.length > 0 && (
            <motion.div variants={item}>
              <h2 className="text-lg font-medium mb-3">Daily Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dailyGoals.map((goal) => (
                  <GoalCardWithEstimation
                    key={goal.id}
                    goal={goal}
                    progressEstimations={progressEstimations}
                    formatEstimationText={formatEstimationText}
                    getValidIcon={getValidIcon}
                    handleShareGoalAchievement={handleShareGoalAchievement}
                    addressLower={addressLower}
                    handleEditGoal={handleEditGoal}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {weeklyGoals.length > 0 && (
            <motion.div variants={item}>
              <h2 className="text-lg font-medium mb-3">Weekly Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {weeklyGoals.map((goal) => (
                  <GoalCardWithEstimation
                    key={goal.id}
                    goal={goal}
                    progressEstimations={progressEstimations}
                    formatEstimationText={formatEstimationText}
                    getValidIcon={getValidIcon}
                    handleShareGoalAchievement={handleShareGoalAchievement}
                    addressLower={addressLower}
                    handleEditGoal={handleEditGoal}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {monthlyGoals.length > 0 && (
            <motion.div variants={item}>
              <h2 className="text-lg font-medium mb-3">Monthly Goals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monthlyGoals.map((goal) => (
                  <GoalCardWithEstimation
                    key={goal.id}
                    goal={goal}
                    progressEstimations={progressEstimations}
                    formatEstimationText={formatEstimationText}
                    getValidIcon={getValidIcon}
                    handleShareGoalAchievement={handleShareGoalAchievement}
                    addressLower={addressLower}
                    handleEditGoal={handleEditGoal}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {goals.length === 0 && !loading && !error && (
            <motion.div variants={item} className="text-center py-10">
              <h3 className="text-lg font-medium mb-2">No goals found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You don&apos;t have any goals set up yet.
              </p>
              <Button onClick={handleRefresh}>Refresh</Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Edit Goal Modal */}
      <EditGoalModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveGoal}
        goal={editingGoal}
        isLoading={loading}
      />
    </>
  );
}
