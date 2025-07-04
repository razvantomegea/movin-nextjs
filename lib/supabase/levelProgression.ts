import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';
import { IProfile, updateProfile } from './profile';

export interface LevelProgressionResult {
  levelIncreased: boolean;
  newLevel: number;
  oldLevel: number;
  categoriesCompleted: string[];
  levelIncrease: number;
}

export interface LevelProgressionInfo {
  currentLevel: number;
  dailyGoalsCompleted: boolean;
  weeklyGoalsCompleted: boolean;
  monthlyGoalsCompleted: boolean;
  potentialLevelIncrease: number;
  nextPossibleLevel: number;
}

/**
 * Check and update user's profile level based on completed goals
 * This is the main function to call when you want to trigger a level check
 */
export async function checkAndUpdateLevel({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<LevelProgressionResult> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client.rpc('trigger_level_check', {
    user_address: address.toLowerCase(),
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Failed to check level progression');
  }

  const result = data[0];
  
  return {
    levelIncreased: result.level_increased,
    newLevel: result.new_level,
    oldLevel: result.old_level,
    categoriesCompleted: result.categories_completed || [],
    levelIncrease: result.new_level - result.old_level,
  };
}

/**
 * Get current level progression information without triggering updates
 */
export async function getLevelProgressionInfo({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<LevelProgressionInfo> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client.rpc('get_level_progression_info', {
    user_address: address.toLowerCase(),
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Failed to get level progression info');
  }

  const result = data[0];
  
  return {
    currentLevel: result.current_level,
    dailyGoalsCompleted: result.daily_goals_completed,
    weeklyGoalsCompleted: result.weekly_goals_completed,
    monthlyGoalsCompleted: result.monthly_goals_completed,
    potentialLevelIncrease: result.potential_level_increase,
    nextPossibleLevel: result.next_possible_level,
  };
}

/**
 * Check if user can level up and what categories are completed
 */
export async function canUserLevelUp({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<{
  canLevelUp: boolean;
  completedCategories: string[];
  potentialIncrease: number;
}> {
  const info = await getLevelProgressionInfo({ address, client });
  
  const completedCategories: string[] = [];
  if (info.dailyGoalsCompleted) completedCategories.push('daily');
  if (info.weeklyGoalsCompleted) completedCategories.push('weekly');
  if (info.monthlyGoalsCompleted) completedCategories.push('monthly');
  
  return {
    canLevelUp: info.potentialLevelIncrease > 0,
    completedCategories,
    potentialIncrease: info.potentialLevelIncrease,
  };
}

/**
 * Manually trigger level update after goal progress changes
 * Use this in components when goals are updated manually
 */
export async function triggerLevelCheck({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<LevelProgressionResult> {
  return checkAndUpdateLevel({ address, client });
}

/**
 * Level increase calculation logic (matches SQL function)
 */
export function calculateLevelIncrease(
  dailyCompleted: boolean,
  weeklyCompleted: boolean,
  monthlyCompleted: boolean
): number {
  let increase = 0;
  if (dailyCompleted) increase += 1;
  if (weeklyCompleted) increase += 2;
  if (monthlyCompleted) increase += 5;
  return increase;
}

/**
 * Get level requirements and rewards information
 */
export function getLevelSystemInfo() {
  return {
    levelRewards: {
      daily: {
        increase: 1,
        description: 'Complete all daily goals',
      },
      weekly: {
        increase: 2,
        description: 'Complete all weekly goals',
      },
      monthly: {
        increase: 5,
        description: 'Complete all monthly goals',
      },
    },
    maxDailyIncrease: 8, // 1 + 2 + 5 if all categories completed
    tips: [
      'Levels increase automatically when you complete all goals in a category',
      'Daily goals give +1 level increase',
      'Weekly goals give +2 level increase',
      'Monthly goals give +5 level increase',
      'You can earn multiple level increases simultaneously',
      'Level checks happen once per day maximum',
    ],
  };
}

/**
 * Hook into goal progress updates to automatically check levels
 * Call this after updating goal progress in your components
 */
export async function updateGoalProgressAndCheckLevel({
  address,
  category = 'daily',
  client,
}: {
  address: string;
  category?: 'daily' | 'weekly' | 'monthly';
  client?: SupabaseClient;
}): Promise<{
  goalUpdateSuccess: boolean;
  levelResult?: LevelProgressionResult;
}> {
  if (!client) {
    client = getClient();
  }

  try {
    // First update goal progress
    const { error: goalError } = await client.rpc('update_goal_progress', {
      user_address: address.toLowerCase(),
      goal_category: category,
    });

    if (goalError) {
      throw goalError;
    }

    // Then check for level progression
    const levelResult = await checkAndUpdateLevel({ address, client });

    return {
      goalUpdateSuccess: true,
      levelResult,
    };
  } catch (error) {
    console.error('Error updating goal progress and checking level:', error);
    throw error;
  }
}

/**
 * Get user's current level efficiently
 */
export async function getUserCurrentLevel({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<number> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('profiles')
    .select('level')
    .eq('address', address.toLowerCase())
    .single();

  if (error) {
    throw error;
  }

  return data?.level || 1;
}

/**
 * Reset goal progress for a specific category (useful for scheduled resets)
 */
export async function resetGoalProgress({
  address,
  category,
  client,
}: {
  address: string;
  category: 'daily' | 'weekly' | 'monthly';
  client?: SupabaseClient;
}): Promise<void> {
  if (!client) {
    client = getClient();
  }

  const { error } = await client.rpc('reset_goal_progress', {
    user_address: address.toLowerCase(),
    goal_category: category,
  });

  if (error) {
    throw error;
  }
}