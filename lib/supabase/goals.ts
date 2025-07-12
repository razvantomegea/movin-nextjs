import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';
import { handleAuthError } from '@/utils/auth';

export type GoalType =
  | 'calories'
  | 'protein'
  | 'carbohydrates'
  | 'fats'
  | 'fiber'
  | 'weight'
  | 'fitness'
  | 'steps'
  | 'mets'
  | 'duration';

export type GoalCategory = 'daily' | 'weekly' | 'monthly';

export interface IGoal {
  id: string;
  address: string;
  goal_type: GoalType;
  target_value: number;
  current_value: number;
  unit: string;
  category: GoalCategory;
  title: string;
  icon: string;
  auto_trigger: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IGoalInput {
  goal_type: GoalType;
  target_value: number;
  unit: string;
  category: GoalCategory;
  title: string;
  icon?: string;
  auto_trigger?: boolean;
}

/**
 * Get all active goals for a user
 */
export async function getUserGoals({
  address,
  category,
  client,
}: {
  address: string;
  category?: GoalCategory;
  client?: SupabaseClient;
}): Promise<IGoal[]> {
  if (!client) {
    client = getClient();
  }

  let query = client
    .from('goals')
    .select('*')
    .eq('address', address.toLowerCase())
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('created_at', { ascending: true });

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'getUserGoals');
    throw error;
  }

  return data || [];
}

/**
 * Get a specific goal by ID
 */
export async function getGoalById({
  id,
  address,
  client,
}: {
  id: string;
  address: string;
  client?: SupabaseClient;
}): Promise<IGoal | null> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('goals')
    .select('*')
    .eq('id', id)
    .eq('address', address.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Goal not found
    }
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'getGoalById');
    throw error;
  }

  return data;
}

/**
 * Create a new goal
 */
export async function createGoal({
  address,
  goalData,
  client,
}: {
  address: string;
  goalData: IGoalInput;
  client?: SupabaseClient;
}): Promise<IGoal> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('goals')
    .insert({
      address,
      ...goalData,
      icon: goalData.icon || getDefaultIcon(goalData.goal_type),
    })
    .select()
    .single();

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'createGoal');
    throw error;
  }

  return data;
}

/**
 * Update an existing goal
 */
export async function updateGoal({
  id,
  address,
  goalData,
  client,
}: {
  id: string;
  address: string;
  goalData: Partial<IGoalInput>;
  client?: SupabaseClient;
}): Promise<IGoal> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('goals')
    .update(goalData)
    .eq('id', id)
    .eq('address', address.toLowerCase())
    .eq('is_active', true)
    .select()
    .single();

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'updateGoal');
    throw error;
  }

  return data;
}

/**
 * Delete a goal (soft delete by setting is_active to false)
 */
export async function deleteGoal({
  id,
  address,
  client,
}: {
  id: string;
  address: string;
  client?: SupabaseClient;
}): Promise<void> {
  if (!client) {
    client = getClient();
  }

  const { error } = await client
    .from('goals')
    .update({ is_active: false })
    .eq('id', id)
    .eq('address', address.toLowerCase());

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'deleteGoal');
    throw error;
  }
}

/**
 * Create default goals for a new user
 */
export async function createDefaultGoals({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IGoal[]> {
  if (!client) {
    client = getClient();
  }

  const { error } = await client.rpc('create_default_goals', {
    user_address: address.toLowerCase(),
  });

  if (error) {
    handleAuthError(
      error instanceof Error ? error : new Error(String(error)),
      'createDefaultGoals',
    );
    throw error;
  }

  // Return the newly created goals
  return getUserGoals({ address, client });
}

/**
 * Update goal progress for a specific category
 */
export async function updateGoalProgress({
  address,
  category = 'daily',
  client,
}: {
  address: string;
  category?: GoalCategory;
  client?: SupabaseClient;
}): Promise<void> {
  if (!client) {
    client = getClient();
  }

  const { error } = await client.rpc('update_goal_progress', {
    user_address: address.toLowerCase(),
    goal_category: category,
  });

  if (error) {
    handleAuthError(
      error instanceof Error ? error : new Error(String(error)),
      'updateGoalProgress',
    );
    throw error;
  }
}

/**
 * Update all goal categories progress
 */
export async function updateAllGoalProgress({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<void> {
  if (!client) {
    client = getClient();
  }

  // Update all categories
  await Promise.all([
    updateGoalProgress({ address, category: 'daily', client }),
    updateGoalProgress({ address, category: 'weekly', client }),
    updateGoalProgress({ address, category: 'monthly', client }),
  ]);
}

/**
 * Get goal statistics for a user
 */
export async function getGoalStats({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<{
  total: number;
  achieved: number;
  byCategory: Record<GoalCategory, { total: number; achieved: number }>;
}> {
  if (!client) {
    client = getClient();
  }

  const goals = await getUserGoals({ address, client });

  const stats = {
    total: goals.length,
    achieved: 0,
    byCategory: {
      daily: { total: 0, achieved: 0 },
      weekly: { total: 0, achieved: 0 },
      monthly: { total: 0, achieved: 0 },
    } as Record<GoalCategory, { total: number; achieved: number }>,
  };

  goals.forEach((goal) => {
    const isAchieved = goal.current_value >= goal.target_value;

    if (isAchieved) {
      stats.achieved++;
    }

    stats.byCategory[goal.category].total++;
    if (isAchieved) {
      stats.byCategory[goal.category].achieved++;
    }
  });

  return stats;
}

/**
 * Get default icon for goal type
 */
function getDefaultIcon(goalType: GoalType): string {
  const iconMap: Record<GoalType, string> = {
    steps: 'steps',
    calories: 'flame',
    protein: 'beef',
    carbohydrates: 'wheat',
    fats: 'droplets',
    fiber: 'leaf',
    weight: 'scale',
    fitness: 'dumbbell',
    mets: 'activity',
    duration: 'clock',
  };

  return iconMap[goalType] || 'target';
}

/**
 * Get icon mappings for UI components
 */
export function getGoalIconMapping(): Record<string, string> {
  return {
    steps: 'steps',
    flame: 'flame',
    beef: 'beef',
    wheat: 'wheat',
    droplets: 'droplets',
    leaf: 'leaf',
    scale: 'scale',
    dumbbell: 'dumbbell',
    activity: 'activity',
    clock: 'clock',
    target: 'target',
    workout: 'workout',
    streak: 'streak',
    level: 'level',
  };
}

/**
 * Check if user has goals set up
 */
export async function userHasGoals({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<boolean> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('goals')
    .select('id')
    .eq('address', address.toLowerCase())
    .eq('is_active', true)
    .limit(1);

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'userHasGoals');
    throw error;
  }

  return (data?.length || 0) > 0;
}
