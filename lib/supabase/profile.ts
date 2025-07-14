import { SupabaseClient } from '@supabase/supabase-js';
import { handleAuthError } from '@/utils/auth';
import { getConnectionStatus } from './connections';
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
    const error = new Error('Profile not found');
    handleAuthError(error, 'updateProfileWithEarnings');
    throw error;
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
    handleAuthError(
      error instanceof Error ? error : new Error(String(error)),
      'updateProfileWithEarnings',
    );
    throw error;
  }

  if (!data || data.length === 0) {
    const error = new Error('Profile update failed: No data returned');
    handleAuthError(error, 'updateProfileWithEarnings');
    throw error;
  }

  return data[0];
}

export interface ILeaderboardUser {
  address: string;
  username: string;
  avatar_url: string;
  level: number;
  streak_days: number;
  total_earned?: number;
  created_at: string;
}

/**
 * Get leaderboard data - top users by level
 */
export async function getLeaderboard({
  limit = 50,
  client,
}: {
  limit?: number;
  client?: SupabaseClient;
} = {}): Promise<ILeaderboardUser[]> {
  // Validate limit parameter
  if (limit <= 0 || limit > 1000) {
    const error = new Error('Limit must be between 1 and 1000');
    handleAuthError(error, 'getLeaderboard');
    throw error;
  }

  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('profiles')
    .select('address, username, avatar_url, level, streak_days, total_earned, created_at')
    .eq('privacy_setting', 'public')
    .order('level', { ascending: false })
    .order('total_earned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'getLeaderboard');
    throw error;
  }

  return data || [];
}

export type ProfilePrivacySetting = 'public' | 'partially_public' | 'private';

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
  privacy_setting?: ProfilePrivacySetting;
  allow_connection_requests?: boolean;
  profile_description?: string;
  location?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface IPublicProfile extends IProfile {
  // Connection status for the viewing user
  connection_status?: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked';
  connection_id?: string;
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
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'getProfile');
    throw error;
  }

  return data?.[0] || null;
}

/**
 * Get a public profile by address with privacy filtering
 * This function respects privacy settings and connection status
 */
export async function getPublicProfile({
  targetAddress,
  viewerAddress,
  client,
}: {
  targetAddress: string;
  viewerAddress?: string;
  client?: SupabaseClient;
}): Promise<Partial<IPublicProfile> | null> {
  if (!client) {
    client = getClient();
  }

  // First, get the basic profile info (only what's allowed by RLS)
  const profile = await getProfile({ address: targetAddress, client });

  if (!profile) {
    return null;
  }

  // If viewer is the profile owner, return full access
  if (viewerAddress === targetAddress) {
    return {
      ...profile,
      connection_status: 'none',
    };
  }

  let connectionStatus: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked' = 'none';
  let connectionId: string | undefined;

  // Check connection status if viewer is provided and not anonymous
  if (viewerAddress) {
    const { connection, status } = await getConnectionStatus({
      userAddress1: viewerAddress,
      userAddress2: targetAddress,
      client,
    });

    if (status) {
      connectionStatus = status;
      connectionId = connection?.id;
    }
  }

  // Return appropriate data based on privacy setting
  const baseProfile: IPublicProfile = {
    ...profile,
    connection_status: connectionStatus,
    connection_id: connectionId,
  };

  // Public profiles show all available info
  if (profile.privacy_setting === 'public') {
    return baseProfile;
  }

  // Partially public profiles show limited info to non-connections
  if (profile.privacy_setting === 'partially_public') {
    if (connectionStatus === 'accepted') {
      // Connected users see full info
      return baseProfile;
    }
  }

  // Private profiles should not be accessible (handled by RLS, but just in case)
  return {
    address: targetAddress,
    avatar_url: profile.avatar_url,
    username: profile.username,
  };
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
      handleAuthError(error instanceof Error ? error : new Error(String(error)), 'updateProfile');
      throw error;
    }

    if (!data || data.length === 0) {
      const error = new Error('Profile update failed: No data returned');
      handleAuthError(error, 'updateProfile');
      throw error;
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
    privacy_setting: profileData.privacy_setting ?? 'public',
    allow_connection_requests: profileData.allow_connection_requests ?? true,
  };

  const { data, error } = await client.from('profiles').insert(dataToInsert).select();

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'updateProfile');
    throw error;
  }

  if (!data || data.length === 0) {
    const error = new Error('Profile creation failed: No data returned');
    handleAuthError(error, 'updateProfile');
    throw error;
  }

  return data[0];
}
