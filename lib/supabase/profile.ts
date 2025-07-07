import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

/**
 * Calculate level based on total MVN earned
 * Level increases by 10% for every 1 MVN earned
 */
export function calculateLevel(totalEarned: number): number {
  // Base level is 1, increases by 10% for every 1 MVN earned
  const baseLevel = 1;
  const levelMultiplier = 1 + totalEarned * 0.1;
  return Math.floor(baseLevel * levelMultiplier);
}

/**
 * Update profile with new MVN earnings
 * This will update both total_earned and level
 */
export async function updateProfileWithEarnings({
  address,
  mvnEarned,
  client,
}: {
  address: string;
  mvnEarned: number;
  client?: SupabaseClient;
}): Promise<IProfile> {
  if (!client) {
    client = getClient();
  }

  const existingProfile = await getProfile({ address, client });

  if (!existingProfile) {
    throw new Error('Profile not found');
  }

  const currentTotalEarned = existingProfile.total_earned || 0;
  const newTotalEarned = currentTotalEarned + mvnEarned;
  const newLevel = calculateLevel(newTotalEarned);

  const { data, error } = await client
    .from('profiles')
    .update({
      total_earned: newTotalEarned,
      level: newLevel,
    })
    .eq('address', address)
    .select();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Profile update failed: No data returned');
  }

  return data[0];
}

export interface IProfile {
  id: string;
  username: string;
  email: string;
  address: string;
  avatar_url: string;
  level: number;
  streak_days: number;
  last_streak_update?: string;
  is_premium: boolean;
  weight?: number;
  weight_unit?: string;
  weight_updated_at?: string;
  height?: number;
  date_of_birth?: string;
  biological_sex?: string;
  total_earned?: number;
  created_at: string;
  updated_at: string;
}

export async function getProfile({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IProfile | null> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client.from('profiles').select('*').eq('address', address);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function updateProfile({
  address,
  profileData,
  client,
}: {
  address: string;
  profileData: Partial<IProfile>;
  client?: SupabaseClient;
}): Promise<IProfile> {
  if (!client) {
    client = getClient();
  }

  const existingProfile = await getProfile({ address, client });

  if (existingProfile) {
    const { data, error } = await client
      .from('profiles')
      .update(profileData)
      .eq('address', address)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Profile update failed: No data returned');
    }

    return data[0];
  }

  const totalEarned = profileData.total_earned ?? 0;
  const calculatedLevel = calculateLevel(totalEarned);

  const dataToInsert: Partial<IProfile> = {
    address,
    // spread first so explicit fallbacks below don't overwrite provided values
    ...profileData,
    is_premium: profileData.is_premium ?? false,
    email: profileData.email ?? '',
    username: profileData.username ?? '',
    avatar_url: profileData.avatar_url ?? '',
    level: profileData.level ?? calculatedLevel,
    streak_days: profileData.streak_days ?? 0,
    total_earned: totalEarned,
  };

  const { data, error } = await client.from('profiles').insert(dataToInsert).select();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Profile creation failed: No data returned');
  }

  return data[0];
}
