import { SupabaseClient } from '@supabase/supabase-js';
import { handleAuthError } from '@/utils/auth';
import { getClient } from './createClient';

export interface IActivity {
  id: string;
  address: string;
  name: string;
  source?: string;
  start_date: string;
  end_date: string;
  duration: number;
  total_energy_burned: number;
  total_distance?: number;
  total_steps?: number;
  maximum_heart_rate?: number;
  average_heart_rate?: number;
  minimum_heart_rate?: number;
  created_at: string;
  updated_at: string;
}

export async function getActivities({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IActivity[]> {
  if (!client) {
    client = getClient();
  }
  const { data, error } = await client
    .from('activities')
    .select()
    .eq('address', address)
    .order('start_date', { ascending: false });

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'getActivities');
    throw error;
  }
  return (data as IActivity[]) || [];
}

export async function insertActivities({
  activityData,
  client,
}: {
  activityData: Partial<IActivity>[];
  client?: SupabaseClient;
}): Promise<IActivity[]> {
  if (!client) {
    client = getClient();
  }

  const activitiesToInsert = activityData.map(({ id, created_at, updated_at, ...rest }) => rest);

  const { data, error } = await client.from('activities').insert(activitiesToInsert).select();

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'insertActivities');
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Activity creation failed: No data returned');
  }
  return data;
}

export async function updateActivity({
  activityData,
  client,
}: {
  activityData: Partial<IActivity>;
  client?: SupabaseClient;
}): Promise<IActivity> {
  if (!client) {
    client = getClient();
  }

  if (!activityData.id) {
    throw new Error('Activity update failed: ID is required');
  }

  const { id, ...updateFields } = activityData;
  const { data, error } = await client
    .from('activities')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'updateActivity');
    throw error;
  }

  return data;
}
