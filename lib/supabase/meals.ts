import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

export interface IMeal {
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

export async function getRecentMeals({
  address,
  limit = 20,
  client,
}: {
  address: string;
  limit?: number;
  client?: SupabaseClient;
}): Promise<IMeal[]> {
  if (!client) {
    client = getClient();
  }
  const { data, error } = await client
    .from('meals')
    .select()
    .eq('address', address.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }
  return (data as IMeal[]) || [];
}

export async function insertMeal({
  address,
  mealData,
  client,
}: {
  address: string;
  mealData: Partial<IMeal>;
  client?: SupabaseClient;
}): Promise<IMeal> {
  if (!client) {
    client = getClient();
  }

  if (!address) {
    throw new Error('Address is required to insert meal');
  }

  const dataToInsert = {
    ...mealData,
    address: address.toLowerCase(), // normalise for consistency
    log_date: mealData.log_date || new Date().toISOString().split('T')[0],
  };
  delete dataToInsert.id;
  delete dataToInsert.created_at;
  delete dataToInsert.updated_at;

  const { error } = await client.from('meals').insert(dataToInsert);

  if (error) {
    throw error;
  }

  // Since we can't get the inserted row back due to RLS, we'll return an optimistic response.
  // The caller should ideally refetch data to get the real server-generated values.
  return {
    ...dataToInsert,
    id: `temp-${Date.now()}`, // Temporary ID
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as IMeal;
}

export async function searchMealsByName({
  address,
  searchTerm,
  limit = 10,
  client,
}: {
  address: string;
  searchTerm: string;
  limit?: number;
  client?: SupabaseClient;
}): Promise<IMeal[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('meals')
    .select()
    .eq('address', address.toLowerCase())
    .ilike('meal_name', `%${searchTerm}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }
  return (data as IMeal[]) || [];
}

export async function deleteMeal({
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

  if (!address) {
    throw new Error('Address is required to delete meal');
  }

  const { error } = await client
    .from('meals')
    .delete()
    .eq('id', id)
    .eq('address', address.toLowerCase());

  if (error) {
    throw error;
  }
}
