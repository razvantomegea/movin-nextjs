import { IActivity } from '@/lib/supabase/activities';
import { IEnergy } from '@/lib/supabase/energy';
import { IProfile } from '@/lib/supabase/profile';

export interface ProgressEstimation {
  currentProgress: number;
  estimatedDaysToCompletion: number | null;
  estimatedCompletionDate: Date | null;
  progressRate: number; // progress per day
  isOnTrack: boolean;
  calorieBasedProgress?: {
    calorieDeficit: number;
    weightChangeFromCalories: number;
    adjustedProgress: number;
  };
}

export interface GoalPeriodInfo {
  startDate: Date;
  endDate: Date;
  totalDays: number;
  daysElapsed: number;
  daysRemaining: number;
}

/**
 * Calculate period information for weekly and monthly goals
 */
export function calculateGoalPeriod(category: 'daily' | 'weekly' | 'monthly'): GoalPeriodInfo {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  if (category === 'weekly') {
    // Start of current week (Monday)
    const dayOfWeek = now.getUTCDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate = new Date(now);
    startDate.setUTCDate(now.getUTCDate() - daysToMonday);
    startDate.setUTCHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6);
    endDate.setUTCHours(23, 59, 59, 999);
  } else if (category === 'monthly') {
    // Start of current month
    startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
    endDate.setUTCHours(23, 59, 59, 999);
  } else {
    // Daily - current day
    startDate = new Date(now);
    startDate.setUTCHours(0, 0, 0, 0);
    endDate = new Date(now);
    endDate.setUTCHours(23, 59, 59, 999);
  }

  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysRemaining = Math.max(0, totalDays - daysElapsed);

  return {
    startDate,
    endDate,
    totalDays,
    daysElapsed,
    daysRemaining,
  };
}

/**
 * Calculate calorie-based weight progress
 */
export async function calculateCalorieBasedWeightProgress(
  goalStartDate: Date,
  currentWeight: number,
  targetWeight: number,
  energyEntries: IEnergy[],
  activities: IActivity[],
  profile: IProfile | null,
): Promise<{ calorieDeficit: number; weightChangeFromCalories: number; adjustedProgress: number }> {
  // Filter data since goal was set
  const relevantEnergyEntries = energyEntries.filter((entry) => {
    return entry.log_date >= goalStartDate.toISOString().split('T')[0];
  });

  const relevantActivities = activities.filter((activity) => {
    return activity.start_date >= goalStartDate.toISOString().split('T')[0];
  });

  // Calculate total calories consumed
  const caloriesConsumed = relevantEnergyEntries.reduce(
    (total, entry) => total + entry.calories,
    0,
  );

  // Calculate total calories burned from activities
  const caloriesBurnedFromActivities = relevantActivities.reduce(
    (total, activity) => total + activity.total_energy_burned,
    0,
  );

  // Estimate BMR calories burned (approximate 1800-2200 calories per day for adults)
  const daysSinceGoalSet = Math.max(
    1,
    Math.floor((new Date().getTime() - goalStartDate.getTime()) / (1000 * 60 * 60 * 24)),
  );

  // Use profile data if available for better BMR estimation
  let estimatedBMR = 2000; // Default
  if (
    profile &&
    profile.weight &&
    profile.height &&
    profile.biological_sex &&
    profile.date_of_birth
  ) {
    estimatedBMR = calculateBMR(profile);
  }

  const bmrCaloriesBurned = estimatedBMR * daysSinceGoalSet;

  // Total calories burned = BMR + activities
  const totalCaloriesBurned = bmrCaloriesBurned + caloriesBurnedFromActivities;

  // Net calorie deficit/surplus
  const calorieDeficit = totalCaloriesBurned - caloriesConsumed;

  // Calculate adjusted progress
  const totalWeightChange = Math.abs(targetWeight - currentWeight);

  // If target equals current weight, goal is already achieved (maintenance goal)
  if (totalWeightChange === 0) {
    // For maintenance goals, show the absolute weight change from calories
    const maintenanceWeightChange = Math.abs(calorieDeficit / 7000);
    return {
      calorieDeficit,
      weightChangeFromCalories: maintenanceWeightChange,
      adjustedProgress: 100, // Goal already achieved
    };
  }

  // Calculate weight change from calories (7000 kcal = 1 kg)
  // Show absolute change - direction will be handled in the context
  const weightChangeFromCalories = Math.abs(calorieDeficit / 7000);

  // Calculate adjusted current weight based on calorie deficit
  // For weight loss goals (target < current): deficit helps progress
  // For weight gain goals (target > current): surplus helps progress
  const isWeightLossGoal = targetWeight < currentWeight;
  const signedWeightChange = calorieDeficit / 7000; // Keep sign for calculation

  let adjustedCurrentWeight = currentWeight;
  if (isWeightLossGoal) {
    // Weight loss goal: positive deficit moves weight down
    adjustedCurrentWeight = currentWeight - signedWeightChange;
  } else {
    // Weight gain goal: negative deficit (surplus) moves weight up
    adjustedCurrentWeight = currentWeight - signedWeightChange;
  }

  const actualWeightChange = Math.abs(adjustedCurrentWeight - currentWeight);
  const adjustedProgress = (actualWeightChange / totalWeightChange) * 100;

  return {
    calorieDeficit,
    weightChangeFromCalories,
    adjustedProgress: Math.min(100, Math.max(0, adjustedProgress)),
  };
}

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 */
function calculateBMR(profile: IProfile): number {
  if (!profile.weight || !profile.height || !profile.biological_sex || !profile.date_of_birth) {
    return 2000; // Default fallback
  }

  const age = new Date().getFullYear() - new Date(profile.date_of_birth).getFullYear();
  const weight = profile.weight; // in kg
  const height = profile.height; // in cm
  const sex = profile.biological_sex.toLowerCase();

  if (sex === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

/**
 * Calculate progress estimation for goals
 */
export function calculateProgressEstimation(
  currentValue: number,
  targetValue: number,
  category: 'daily' | 'weekly' | 'monthly',
  goalCreatedAt: string,
  calorieBasedProgress?: {
    calorieDeficit: number;
    weightChangeFromCalories: number;
    adjustedProgress: number;
  },
): ProgressEstimation {
  const goalCreationDate = new Date(goalCreatedAt);
  const now = new Date();
  const periodInfo = calculateGoalPeriod(category);

  // Use calorie-based progress for weight goals if available
  const basicProgress =
    targetValue === 0 ? 0 : Math.min(100, Math.max(0, (currentValue / targetValue) * 100));
  const effectiveProgress = calorieBasedProgress?.adjustedProgress ?? basicProgress;

  // Calculate progress rate
  let progressRate = 0;
  let estimatedDaysToCompletion: number | null = null;
  let estimatedCompletionDate: Date | null = null;

  // If goal is already achieved, handle differently
  if (effectiveProgress >= 100) {
    progressRate = 0; // No rate needed for completed goals
    estimatedDaysToCompletion = null;
    estimatedCompletionDate = null;
  } else if (category === 'daily') {
    // For daily goals, use the current day's progress
    progressRate = effectiveProgress; // Progress for today
    const remainingProgress = 100 - effectiveProgress;

    if (remainingProgress > 0 && progressRate > 0) {
      // Estimate based on current daily rate
      estimatedDaysToCompletion = 1; // Should complete today if on track
    }
  } else {
    // For weekly/monthly goals, calculate average daily progress
    const periodStart =
      periodInfo.startDate > goalCreationDate ? periodInfo.startDate : goalCreationDate;
    const daysElapsed = Math.max(
      1,
      Math.floor((now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    );
    progressRate = effectiveProgress / daysElapsed;

    const remainingProgress = 100 - effectiveProgress;

    if (remainingProgress > 0 && progressRate > 0) {
      estimatedDaysToCompletion = Math.ceil(remainingProgress / progressRate);
      estimatedCompletionDate = new Date();
      estimatedCompletionDate.setDate(now.getDate() + estimatedDaysToCompletion);
    }
  }

  // Determine if on track for period completion
  const expectedProgress =
    category === 'daily' ? 0 : (periodInfo.daysElapsed / periodInfo.totalDays) * 100; // For daily, any progress is good
  const isOnTrack =
    category === 'daily'
      ? effectiveProgress > 0 // For daily goals, any progress is considered on track
      : effectiveProgress >= expectedProgress * 0.8; // 80% of expected progress for weekly/monthly

  return {
    currentProgress: effectiveProgress,
    estimatedDaysToCompletion,
    estimatedCompletionDate,
    progressRate,
    isOnTrack,
    calorieBasedProgress,
  };
}

/**
 * Format estimation text for display
 */
export function formatEstimationText(
  estimation: ProgressEstimation,
  category: 'daily' | 'weekly' | 'monthly',
): string {
  if (estimation.currentProgress >= 100) {
    return '🎉 Goal achieved!';
  }

  if (category === 'daily') {
    if (estimation.isOnTrack) {
      return '✅ On track for today';
    } else {
      return '⚠️ Behind daily target';
    }
  }

  if (estimation.estimatedDaysToCompletion && estimation.estimatedCompletionDate) {
    const periodInfo = calculateGoalPeriod(category);

    if (estimation.estimatedCompletionDate <= periodInfo.endDate) {
      const days = estimation.estimatedDaysToCompletion;
      return `📅 Est. ${days} day${days !== 1 ? 's' : ''} to completion`;
    } else {
      return `⚠️ May not complete this ${category}`;
    }
  }

  if (estimation.progressRate > 0) {
    return `📈 ${estimation.progressRate.toFixed(1)}% progress/day`;
  }

  return '📊 Tracking progress...';
}
