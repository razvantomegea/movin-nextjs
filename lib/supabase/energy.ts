import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

export interface IEnergy {
  id: string;
  address: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  log_date: string;
  meal_name: string;
  created_at: string;
  updated_at: string;
}

export async function getEnergyEntries({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IEnergy[]> {
  if (!client) {
    client = getClient();
  }
  const { data, error } = await client
    .from('energy')
    .select()
    .eq('address', address)
    .order('log_date', { ascending: false });

  if (error) {
    throw error;
  }
  return (data as IEnergy[]) || [];
}

export async function insertEnergyEntry({
  energyData,
  client,
}: {
  energyData: Partial<IEnergy>;
  client?: SupabaseClient;
}): Promise<IEnergy> {
  if (!client) {
    client = getClient();
  }

  const dataToInsert = {
    ...energyData,
    log_date: energyData.log_date || new Date().toISOString().split('T')[0],
  };
  delete dataToInsert.id;
  delete dataToInsert.created_at;
  delete dataToInsert.updated_at;

  const { data, error } = await client.from('energy').insert(dataToInsert).select().single();
  if (error) {
    throw error;
  }
  return data;
}

export async function updateEnergyEntry({
  energyData,
  client,
}: {
  energyData: Partial<IEnergy>;
  client?: SupabaseClient;
}): Promise<IEnergy> {
  if (!client) {
    client = getClient();
  }

  if (!energyData.id) {
    throw new Error('Energy entry update failed: ID is required');
  }

  const { id, ...updateFields } = energyData;
  const { data, error } = await client
    .from('energy')
    .update(updateFields)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getEnergyEntriesByDateRange({
  address,
  startDate,
  endDate,
  client,
}: {
  address: string;
  startDate: string;
  endDate: string;
  client?: SupabaseClient;
}): Promise<IEnergy[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('energy')
    .select()
    .eq('address', address)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false });

  if (error) {
    throw error;
  }
  return (data as IEnergy[]) || [];
}

export async function getTodaysEnergyEntries({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IEnergy[]> {
  const today = new Date().toISOString().split('T')[0];
  return getEnergyEntriesByDateRange({
    address,
    startDate: today,
    endDate: today,
    client,
  });
}
