'use client';

import { useEffect } from 'react';

import { motion } from 'framer-motion';
import { GoalProgressCard } from './goal-progress-card';
import { showSuccessToast, showInfoToast, showErrorToast } from '@/lib/redux/slices/toastSlice';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { RefreshButton } from '@/components/refresh-button';
import { fetchGoals } from '@/lib/redux/slices/goalsSlice';
import { GoalsPageSkeleton } from './goals-page-skeleton';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  const { goals, loading, error, lastUpdated } = useAppSelector((state) => state.goals);

  useEffect(() => {
    // Fetch goals on component mount
    dispatch(fetchGoals());
  }, [dispatch]);

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
    try {
      await dispatch(fetchGoals()).unwrap();
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
  const achievementGoals = goals.filter((goal) => goal.category === 'achievement');

  if (loading && !lastUpdated) {
    return <GoalsPageSkeleton />;
  }

  if (error && !lastUpdated) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full">
        <div className="flex flex-col items-center text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to load goals</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Button onClick={() => dispatch(fetchGoals())}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="p-4" initial="hidden" animate="show" variants={container}>
      <motion.div className="mb-6" variants={item}>
        <div className="flex items-center">
          <h1 className="text-2xl font-bold mr-2">Your Goals</h1>
          <RefreshButton onRefresh={handleRefresh} isLoading={loading} />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track your progress and earn rewards
        </p>
      </motion.div>

      <div className="space-y-6">
        {dailyGoals.length > 0 && (
          <motion.div variants={item}>
            <h2 className="text-lg font-medium mb-3">Daily Goals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyGoals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  title={goal.title}
                  currentValue={goal.currentValue}
                  targetValue={goal.targetValue}
                  unit={goal.unit}
                  icon={getValidIcon(goal.icon)}
                  autoTrigger={goal.autoTrigger}
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
                <GoalProgressCard
                  key={goal.id}
                  title={goal.title}
                  currentValue={goal.currentValue}
                  targetValue={goal.targetValue}
                  unit={goal.unit}
                  icon={getValidIcon(goal.icon)}
                  autoTrigger={goal.autoTrigger}
                />
              ))}
            </div>
          </motion.div>
        )}

        {achievementGoals.length > 0 && (
          <motion.div variants={item}>
            <h2 className="text-lg font-medium mb-3">Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievementGoals.map((goal) => (
                <GoalProgressCard
                  key={goal.id}
                  title={goal.title}
                  currentValue={goal.currentValue}
                  targetValue={goal.targetValue}
                  unit={goal.unit}
                  icon={getValidIcon(goal.icon)}
                  autoTrigger={goal.autoTrigger}
                />
              ))}
            </div>
          </motion.div>
        )}

        {goals.length === 0 && !loading && !error && (
          <motion.div variants={item} className="text-center py-10">
            <h3 className="text-lg font-medium mb-2">No goals found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              You don't have any goals set up yet.
            </p>
            <Button onClick={handleRefresh}>Refresh</Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
