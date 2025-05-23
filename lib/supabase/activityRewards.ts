import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

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
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('activity_rewards')
    .select('*')
    .eq('address', address)
    .order('created_at', { ascending: false });

  if (error) {
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
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client.from('activity_rewards').select('*').eq('id', id).single();

  if (error) {
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
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Activity reward creation failed: No data returned');
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
    throw new Error('Activity reward update failed: ID is required');
  }

  const { data, error } = await client
    .from('activity_rewards')
    .update(rewardData)
    .eq('id', rewardData.id)
    .select();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Activity reward update failed: No data returned');
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
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('activity_rewards')
    .select('rewards')
    .eq('address', address);

  if (error) {
    throw error;
  }

  if (!data) {
    return 0;
  }

  return data.reduce((sum, reward) => sum + Number(reward.rewards), 0);
}

/**
 * Get activity rewards history for an address
 */
export async function getActivityRewardsHistory({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IActivityReward[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('activity_rewards')
    .select('*')
    .eq('address', address)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
