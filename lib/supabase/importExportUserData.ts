import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

export async function exportUserData({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<unknown> {
  if (!address) {
    throw new Error('Address is required to export data');
  }
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client.rpc('export_user_data', {
    user_address: address,
  });

  if (error) {
    throw error;
  }
  return data;
}

export async function importUserData({
  address,
  data,
  client,
}: {
  address: string;
  data: unknown;
  client?: SupabaseClient;
}): Promise<void> {
  if (!address) {
    throw new Error('Address is required to import data');
  }
  if (!client) {
    client = getClient();
  }

  const { error } = await client.rpc('import_user_data', {
    user_address: address,
    import_data: data,
  });

  if (error) {
    throw error;
  }
}
