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
  address,
  energyData,
  client,
}: {
  address: string;
  energyData: Partial<IEnergy>;
  client?: SupabaseClient;
}): Promise<IEnergy> {
  if (!client) {
    client = getClient();
  }

  if (!address) {
    throw new Error('Address is required to insert energy entry');
  }

  const dataToInsert = {
    ...energyData,
    address, // Ensure address is always set
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
  address,
  energyData,
  client,
}: {
  address: string;
  energyData: Partial<IEnergy>;
  client?: SupabaseClient;
}): Promise<IEnergy> {
  if (!client) {
    client = getClient();
  }

  if (!address) {
    throw new Error('Address is required to update energy entry');
  }

  if (!energyData.id) {
    throw new Error('Energy entry update failed: ID is required');
  }

  const { id, ...updateFields } = energyData;
  const { data, error } = await client
    .from('energy')
    .update(updateFields)
    .eq('id', id)
    .eq('address', address) // Ensure user can only update their own entries
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
