'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Flame, Star, Edit3, Clock, TrendingUp } from 'lucide-react';
import { useTheme } from 'next-themes';
import { CelebrationAnimation } from '@/components/celebration-animation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ProgressEstimation } from '@/utils/goals/progressCalculations';

interface GoalProgressCardProps {
  title: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  icon: 'steps' | 'workout' | 'streak' | 'level';
  autoTrigger?: boolean;
  onShare?: () => void;
  userAddress?: string;
  onEdit?: () => void;
  category?: 'daily' | 'weekly' | 'monthly';
  progressEstimation?: ProgressEstimation;
  estimationText?: string;
}

export function GoalProgressCard({
  title,
  currentValue,
  targetValue,
  unit,
  icon,
  autoTrigger = false,
  onShare,
  userAddress,
  onEdit,
  category = 'daily',
  progressEstimation,
  estimationText,
}: GoalProgressCardProps) {
  const [progress, setProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Use enhanced progress if available, otherwise calculate basic progress
  const progressPercentage =
    progressEstimation?.currentProgress ??
    Math.min(Math.round((currentValue / targetValue) * 100), 100);

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(progressPercentage);
    }, 500);
    return () => clearTimeout(timer);
  }, [progressPercentage]);

  // Auto trigger celebration if goal is reached and autoTrigger is true
  useEffect(() => {
    if (autoTrigger && progressPercentage >= 100 && !hasTriggered) {
      const timer = setTimeout(() => {
        setShowCelebration(true);
        setHasTriggered(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progressPercentage, autoTrigger, hasTriggered]);

  const getIcon = () => {
    switch (icon) {
      case 'steps':
        return <Trophy className="h-5 w-5 text-blue-500" />;
      case 'workout':
        return <Award className="h-5 w-5 text-purple-500" />;
      case 'streak':
        return <Flame className="h-5 w-5 text-orange-500" />;
      case 'level':
        return <Star className="h-5 w-5 text-green-500" />;
    }
  };

  const getAchievementTitle = () => {
    switch (icon) {
      case 'steps':
        return 'Daily Step Goal';
      case 'workout':
        return 'Workout Goal';
      case 'streak':
        return 'Activity Streak';
      case 'level':
        return 'Level Up';
    }
  };

  // Extract weight trend label for calorie-based progress
  let weightTrendLabel = '';
  if (progressEstimation?.calorieBasedProgress) {
    if (currentValue === targetValue) {
      weightTrendLabel = ' (maintenance)';
    } else if (progressEstimation.calorieBasedProgress.calorieDeficit > 0) {
      weightTrendLabel = ' (loss)';
    } else {
      weightTrendLabel = ' (gain)';
    }
  }

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 400, damping: 10 }}
      >
        <Card
          className={`${
            isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
          } relative group`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="bg-blue-500/20 p-1.5 rounded-full mr-2">{getIcon()}</div>
                <span className="text-sm font-medium">{title}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Edit Button */}
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                  >
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
                <AnimatePresence>
                  {progressPercentage >= 100 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="bg-green-500/20 p-1 rounded-full cursor-pointer"
                      onClick={() => setShowCelebration(true)}
                    >
                      <Trophy className="h-4 w-4 text-green-500" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xl font-bold">
                {currentValue.toLocaleString()}{' '}
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {unit}
                </span>
              </span>
              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Goal: {targetValue.toLocaleString()} {unit}
              </span>
            </div>

            <div className="relative">
              <Progress value={progress} className="h-2" />
              {progressPercentage >= 100 && (
                <motion.div
                  className="absolute inset-0 bg-green-500/20 rounded-full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
                />
              )}
            </div>

            <div className="flex justify-between items-center mt-1">
              <div className="flex items-center gap-2">
                {progressEstimation?.isOnTrack && category !== 'daily' && (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                )}
                {estimationText && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">{estimationText}</span>
                )}
              </div>
              <span className="text-xs font-medium text-blue-500">
                {Math.round(progressPercentage)}%
              </span>
            </div>

            {/* Calorie-based weight progress details */}
            {progressEstimation?.calorieBasedProgress && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="flex items-center gap-1 mb-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Calorie Analysis
                  </span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-0.5">
                  <div>
                    Deficit: {progressEstimation.calorieBasedProgress.calorieDeficit > 0 ? '+' : ''}
                    {Math.round(
                      progressEstimation.calorieBasedProgress.calorieDeficit,
                    ).toLocaleString()}{' '}
                    kcal
                  </div>
                  <div>
                    Weight trend:{' '}
                    {progressEstimation.calorieBasedProgress.calorieDeficit > 0 ? '-' : '+'}
                    {progressEstimation.calorieBasedProgress.weightChangeFromCalories.toFixed(2)} kg
                    {weightTrendLabel}
                  </div>
                  <div className="text-blue-600 dark:text-blue-400 font-medium">
                    Calorie-based progress:{' '}
                    {Math.round(progressEstimation.calorieBasedProgress.adjustedProgress)}%
                  </div>
                </div>
              </div>
            )}

            {/* Progress rate for non-daily goals (only show if not completed) */}
            {category !== 'daily' &&
              progressPercentage < 100 &&
              progressEstimation?.progressRate &&
              progressEstimation.progressRate > 0 && (
                <div className="mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Rate: {progressEstimation.progressRate.toFixed(1)}% per day
                    </span>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </motion.div>

      <CelebrationAnimation
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        achievementType={icon}
        achievementValue={`${targetValue.toLocaleString()} ${unit}`}
        achievementTitle={getAchievementTitle()}
        description={`Congratulations! You've reached your ${title.toLowerCase()} goal.`}
        onShare={onShare}
        showShareButton={!!userAddress && !!onShare}
      />
    </>
  );
}
