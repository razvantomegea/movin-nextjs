import { SupabaseClient } from '@supabase/supabase-js';
import { handleAuthError } from '@/utils/auth';
import { getClient } from './createClient';

export async function exportUserData({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<unknown> {
  if (!address) {
    const error = new Error('Address is required to export data');
    handleAuthError(error, 'exportUserData');
    throw error;
  }
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client.rpc('export_user_data', {
    user_address: address,
  });

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'exportUserData');
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
    const error = new Error('Address is required to import data');
    handleAuthError(error, 'importUserData');
    throw error;
  }
  if (!client) {
    client = getClient();
  }

  const { error } = await client.rpc('import_user_data', {
    user_address: address,
    import_data: data,
  });

  if (error) {
    handleAuthError(error instanceof Error ? error : new Error(String(error)), 'importUserData');
    throw error;
  }
}
