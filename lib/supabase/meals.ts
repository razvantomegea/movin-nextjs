import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

export interface IMeal {
  id: string;
  address: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
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
    console.error('Error fetching recent meals:', error);
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
  mealData: Partial<IMeal>; // Should not contain id, created_at, updated_at
  client?: SupabaseClient;
}): Promise<IMeal> {
  if (!client) {
    client = getClient();
  }

  if (!address) {
    throw new Error('Address is required to insert meal');
  }
  if (!mealData.meal_name) {
    throw new Error('Meal name is required to insert meal');
  }

  // Prepare data for insertion, ensuring no client-side id/timestamps are passed
  const dataToInsert = {
    ...mealData,
    address: address.toLowerCase(),
    log_date: mealData.log_date || new Date().toISOString().split('T')[0],
    // Ensure these are not in mealData or are explicitly removed if they could be
    id: undefined,
    created_at: undefined,
    updated_at: undefined,
  };
  // Remove properties that should be auto-generated or are not part of the meal data itself
  delete dataToInsert.id;
  delete dataToInsert.created_at;
  delete dataToInsert.updated_at;

  const { data: insertedData, error } = await client
    .from('meals')
    .insert(dataToInsert)
    .select() // Select the inserted row
    .single(); // Expect a single row back

  if (error) {
    console.error('Error inserting meal:', error);
    throw error;
  }

  if (!insertedData) {
    console.error('No data returned after insert meal');
    throw new Error('Failed to insert meal, no data returned.');
  }

  return insertedData as IMeal;
}

export async function updateMeal({
  mealId,
  address,
  mealData,
  client,
}: {
  mealId: string;
  address: string;
  mealData: Partial<IMeal>; // Fields to update
  client?: SupabaseClient;
}): Promise<IMeal> {
  if (!client) {
    client = getClient();
  }

  if (!mealId || !address) {
    throw new Error('Meal ID and address are required to update a meal.');
  }

  // Prepare data for update, ensuring address is not changed, and id/created_at are not part of payload
  const dataToUpdate = {
    ...mealData,
    updated_at: new Date().toISOString(), // Set updated_at timestamp
    // Ensure these are not part of the mealData payload for an update, or remove them
    address: undefined,
    id: undefined,
    created_at: undefined,
    log_date: mealData.log_date
      ? new Date(mealData.log_date).toISOString().split('T')[0]
      : undefined,
  };
  delete dataToUpdate.address; // Address should not be updatable this way
  delete dataToUpdate.id; // ID is used for matching, not updating
  delete dataToUpdate.created_at; // created_at should not be updated

  // Remove any undefined fields from dataToUpdate to avoid overwriting with null
  Object.keys(dataToUpdate).forEach(
    (key) =>
      dataToUpdate[key as keyof typeof dataToUpdate] === undefined &&
      delete dataToUpdate[key as keyof typeof dataToUpdate],
  );

  const { data: updatedData, error } = await client
    .from('meals')
    .update(dataToUpdate)
    .eq('id', mealId)
    .eq('address', address.toLowerCase()) // Ensure user owns the meal
    .select() // Select the updated row
    .single(); // Expect a single row back

  if (error) {
    console.error('Error updating meal:', error);
    throw error;
  }
  if (!updatedData) {
    console.error('No data returned after update meal');
    throw new Error('Failed to update meal, no data returned or meal not found.');
  }
  return updatedData as IMeal;
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
    console.error('Error searching meals by name:', error);
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

  if (!address || !id) {
    throw new Error('Meal ID and address are required to delete a meal.');
  }

  const { error } = await client
    .from('meals')
    .delete()
    .eq('id', id)
    .eq('address', address.toLowerCase());

  if (error) {
    console.error('Error deleting meal:', error);
    throw error;
  }
}
