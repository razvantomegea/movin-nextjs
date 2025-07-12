import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';
import { handleAuthError } from '@/utils/auth';

export interface IActivityReward {
  id: string;
  address: string;
  rewards: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all activity rewards for a specific address
 */
export async function getUserActivityRewards({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IActivityReward[]> {
  if (!address || address.trim() === '') {
    const error = new Error('Address is required');
    handleAuthError(error, 'getUserActivityRewards');
    throw error;
  }

  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('activity_rewards')
    .select('*')
    .eq('address', address)
    .order('created_at', { ascending: false });

  if (error) {
    handleAuthError(
      error instanceof Error ? error : new Error(String(error)),
      'getUserActivityRewards',
    );
    throw error;
  }

  return data || [];
}

/**
 * Get a specific activity reward by ID
 */
export async function getActivityRewardById({
  id,
  client,
}: {
  id: string;
  client?: SupabaseClient;
}): Promise<IActivityReward | null> {
  if (!id || id.trim() === '') {
    const error = new Error('ID is required');
    handleAuthError(error, 'getActivityRewardById');
    throw error;
  }

  if (!client) {
    client = getClient();
  }

  const { data, error } = await client.from('activity_rewards').select('*').eq('id', id).single();

  if (error) {
    handleAuthError(
      error instanceof Error ? error : new Error(String(error)),
      'getActivityRewardById',
    );
    throw error;
  }

  return data;
}

/**
 * Create a new activity reward record
 */
export async function insertActivityReward({
  rewardData,
  client,
}: {
  rewardData: Partial<IActivityReward>;
  client?: SupabaseClient;
}): Promise<IActivityReward> {
  if (!client) {
    client = getClient();
  }

  // Remove id if present to let the database generate it
  const dataToInsert = { ...rewardData };
  delete dataToInsert.id;

  const { data, error } = await client.from('activity_rewards').insert(dataToInsert).select();

  if (error) {
    handleAuthError(
      error instanceof Error ? error : new Error(String(error)),
      'insertActivityReward',
    );
    throw error;
  }

  if (!data || data.length === 0) {
    const error = new Error('Activity reward creation failed: No data returned');
    handleAuthError(error, 'insertActivityReward');
    throw error;
  }

  return data[0];
}

/**
 * Update an activity reward by ID
 */
export async function updateActivityReward({
  rewardData,
  client,
}: {
  rewardData: Partial<IActivityReward>;
  client?: SupabaseClient;
}): Promise<IActivityReward> {
  if (!client) {
    client = getClient();
  }

  if (!rewardData.id) {
    const error = new Error('Activity reward update failed: ID is required');
    handleAuthError(error, 'updateActivityReward');
    throw error;
  }

  const { data, error } = await client
    .from('activity_rewards')
    .update(rewardData)
    .eq('id', rewardData.id)
    .select();

  if (error) {
    handleAuthError(
      error instanceof Error ? error : new Error(String(error)),
      'updateActivityReward',
    );
    throw error;
  }

  if (!data || data.length === 0) {
    const error = new Error('Activity reward update failed: No data returned');
    handleAuthError(error, 'updateActivityReward');
    throw error;
  }

  return data[0];
}

/**
 * Get the total activity rewards for an address
 */
export async function getTotalActivityRewards({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<number> {
  if (!address || address.trim() === '') {
    const error = new Error('Address is required');
    handleAuthError(error, 'getTotalActivityRewards');
    throw error;
  }

  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('activity_rewards')
    .select('rewards')
    .eq('address', address);

  if (error) {
    handleAuthError(
      error instanceof Error ? error : new Error(String(error)),
      'getTotalActivityRewards',
    );
    throw error;
  }

  if (!data) {
    return 0;
  }

  return data.reduce((sum, reward) => {
    const rewardValue = Number(reward.rewards);
    return sum + (isNaN(rewardValue) ? 0 : rewardValue);
  }, 0);
}
