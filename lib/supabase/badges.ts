import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

export type BadgeRequirementValue = string | number | boolean | Date;

export interface BadgeValidationRule {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value?: BadgeRequirementValue;
}

export interface BadgeRequirementCriteria {
  minValue?: number;
  maxValue?: number;
  targetValue?: number | string;
  conditions?: string[];
  timeWindow?: {
    start?: string;
    end?: string;
    duration?: number;
  };
  activityTypes?: string[];
  userFields?: string[];
}

export interface BadgeRequirementCondition {
  // For complex conditions that don't fit standard requirement types
  type?: 'profile_complete' | 'has_stakes' | 'premium_status' | 'custom';
  criteria?: BadgeRequirementCriteria;
  validation?: BadgeValidationRule[];
}

export interface BadgeMilestone {
  value: number;
  achieved: boolean;
  achievedAt?: string;
}

export interface BadgeMetadata {
  source?: 'activity' | 'profile' | 'social' | 'system';
  activityId?: string;
  activityType?: string;
  achievementDate?: string;
  calculationMethod?: string;
  notes?: string;
  version?: string;
  tags?: string[];
  customData?: Record<string, BadgeRequirementValue>;
}

export interface BadgeProgressData {
  current?: number;
  required?: number;
  percentage?: number;
  lastUpdated?: string;
  milestones?: BadgeMilestone[];
  metadata?: BadgeMetadata;
}

export interface IBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'distance' | 'steps' | 'streak' | 'social' | 'time' | 'special' | 'calories';
  requirement_type: 'total' | 'single_activity' | 'streak' | 'condition';
  requirement_value?: number;
  requirement_unit?: string;
  requirement_condition?: BadgeRequirementCondition;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IUserBadge {
  id: string;
  address: string;
  badge_id: string;
  earned_at: string;
  progress_data?: BadgeProgressData;
  created_at: string;
  badge?: IBadge; // Populated when joining with badges table
}

/**
 * Get all available badges
 */
export async function getAllBadges({
  client,
}: {
  client?: SupabaseClient;
} = {}): Promise<IBadge[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('rarity', { ascending: true })
    .order('requirement_value', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get badges by category
 */
export async function getBadgesByCategory({
  category,
  client,
}: {
  category: string;
  client?: SupabaseClient;
}): Promise<IBadge[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('badges')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('requirement_value', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get user's earned badges
 */
export async function getUserBadges({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IUserBadge[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('user_badges')
    .select(
      `
      *,
      badge:badges(*)
    `,
    )
    .eq('address', address)
    .order('earned_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Award a badge to a user
 */
export async function awardBadge({
  address,
  badgeId,
  progressData,
  client,
}: {
  address: string;
  badgeId: string;
  progressData?: BadgeProgressData;
  client?: SupabaseClient;
}): Promise<IUserBadge> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('user_badges')
    .insert({
      address,
      badge_id: badgeId,
      progress_data: progressData,
    })
    .select(
      `
      *,
      badge:badges(*)
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Check if user has a specific badge
 */
export async function hasUserBadge({
  address,
  badgeId,
  client,
}: {
  address: string;
  badgeId: string;
  client?: SupabaseClient;
}): Promise<boolean> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('user_badges')
    .select('id')
    .eq('address', address)
    .eq('badge_id', badgeId)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is expected
    throw error;
  }

  return !!data;
}

/**
 * Get badge progress for tracking achievements
 */
export async function getBadgeProgress({
  address,
  badgeIds,
  client,
}: {
  address: string;
  badgeIds: string[];
  client?: SupabaseClient;
}): Promise<Record<string, BadgeProgressData>> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('user_badges')
    .select('badge_id, progress_data')
    .eq('address', address)
    .in('badge_id', badgeIds);

  if (error) {
    throw error;
  }

  return data.reduce((acc, item) => {
    acc[item.badge_id] = item.progress_data || {};
    return acc;
  }, {} as Record<string, BadgeProgressData>);
}

/**
 * Get user's badge stats
 */
export async function getUserBadgeStats({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<{
  total: number;
  byRarity: Record<string, number>;
  byCategory: Record<string, number>;
  recent: IUserBadge[];
}> {
  if (!client) {
    client = getClient();
  }

  const userBadges = await getUserBadges({ address, client });

  const stats = {
    total: userBadges.length,
    byRarity: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    recent: userBadges.slice(0, 5), // Last 5 earned badges
  };

  userBadges.forEach((userBadge) => {
    if (userBadge.badge) {
      const rarity = userBadge.badge.rarity;
      const category = userBadge.badge.category;

      stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }
  });

  return stats;
}
