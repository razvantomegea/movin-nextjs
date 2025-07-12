import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';
import { handleAuthError } from '@/utils/auth';

export interface IStake {
  id: string;
  address: string;
  amount: number;
  rewards: number;
  stake_time: string;
  unstake_time: string | null;
  lock_period_months: number;
  apr: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get all stakes for a specific address
 */
export async function getUserStakes({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IStake[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('staking')
    .select('*')
    .eq('address', address)
    .order('created_at', { ascending: false });

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'getUserStakes');
    throw error;
  }

  return data || [];
}

/**
 * Get a specific stake by ID
 */
export async function getStakeById({
  id,
  client,
}: {
  id: string;
  client?: SupabaseClient;
}): Promise<IStake | null> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client.from('staking').select('*').eq('id', id).single();

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'getStakeById');
    throw error;
  }

  return data;
}

/**
 * Create a new stake
 */
export async function insertStakes({
  stakeData,
  client,
}: {
  stakeData: Partial<IStake>[];
  client?: SupabaseClient;
}): Promise<IStake[]> {
  if (!client) {
    client = getClient();
  }

  const stakesToInsert = stakeData.map((stake) => {
    delete stake.id;

    return stake;
  });

  const { data, error } = await client.from('staking').insert(stakesToInsert).select();

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'insertStakes');
    throw error;
  }

  if (!data || data.length === 0) {
    const error = new Error('Stake creation failed: No data returned');
    handleAuthError(error, 'insertStakes');
    throw error;
  }

  return data;
}

/**
 * Update a stake by ID
 */
export async function updateStake({
  stakeData,
  client,
}: {
  stakeData: Partial<IStake>;
  client?: SupabaseClient;
}): Promise<IStake> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('staking')
    .update(stakeData)
    .eq('id', stakeData.id)
    .select();

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'updateStake');
    throw error;
  }

  if (!data || data.length === 0) {
    const error = new Error('Stake update failed: No data returned');
    handleAuthError(error, 'updateStake');
    throw error;
  }

  return data[0];
}

/**
 * Add rewards to a stake
 */
export async function addStakeRewards({
  stake,
  client,
}: {
  stake: Partial<IStake>;
  client?: SupabaseClient;
}): Promise<IStake> {
  if (!client) {
    client = getClient();
  }

  if (!stake.id) {
    delete stake.id;

    const newStakes = await insertStakes({
      stakeData: [stake],
    });

    return newStakes[0];
  }

  // First get the current rewards
  const stakeDb = await getStakeById({ id: stake.id, client });

  if (!stakeDb) {
    delete stake.id;

    const newStakes = await insertStakes({
      stakeData: [stake],
    });

    return newStakes[0];
  }

  // Add the new rewards to the current rewards
  const newRewards = stakeDb.rewards + (stake.rewards || 0);

  // Update the stake with the new rewards
  return updateStake({ stakeData: { ...stakeDb, rewards: newRewards }, client });
}

/**
 * Get the total staked amount and rewards for an address
 */
export async function getStakeTotals({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<{ totalStaked: number; totalRewards: number }> {
  if (!client) {
    client = getClient();
  }

  const stakes = await getUserStakes({ address, client });

  const totalStaked = stakes.reduce((sum, stake) => {
    // Only count active stakes
    return stake.is_active ? sum + stake.amount : sum;
  }, 0);

  const totalRewards = stakes.reduce((sum, stake) => sum + stake.rewards, 0);

  return {
    totalStaked,
    totalRewards,
  };
}

/**
 * Get staking history for an address
 */
export async function getStakingHistory({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IStake[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('staking')
    .select('*')
    .eq('address', address)
    .order('created_at', { ascending: false });

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'getStakingHistory');
    throw error;
  }

  return data || [];
}
