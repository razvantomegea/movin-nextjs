import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

export interface IProfile {
  id: string;
  username: string;
  email: string;
  address: string;
  avatar_url: string;
  level: number;
  streak_days: number;
  last_streak_update?: string;
  is_premium: boolean;
  weight?: number;
  weight_unit?: string;
  weight_updated_at?: string;
  height?: number;
  date_of_birth?: string;
  biological_sex?: string;
  created_at: string;
  updated_at: string;
}

export async function getProfile({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IProfile | null> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client.from('profiles').select('*').eq('address', address);

  if (error) {
    throw error;
  }

  return data?.[0] || null;
}

export async function updateProfile({
  address,
  profileData,
  client,
}: {
  address: string;
  profileData: Partial<IProfile>;
  client?: SupabaseClient;
}): Promise<IProfile> {
  if (!client) {
    client = getClient();
  }

  const existingProfile = await getProfile({ address, client });

  if (existingProfile) {
    const { data, error } = await client
      .from('profiles')
      .update(profileData)
      .eq('address', address)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('Profile update failed: No data returned');
    }

    return data[0];
  }

  const dataToInsert: Partial<IProfile> = {
    address,
    // spread first so explicit fallbacks below don't overwrite provided values
    ...profileData,
    is_premium: profileData.is_premium ?? false,
    email: profileData.email ?? '',
    username: profileData.username ?? '',
    avatar_url: profileData.avatar_url ?? '',
    level: profileData.level ?? 1,
    streak_days: profileData.streak_days ?? 0,
  };

  const { data, error } = await client.from('profiles').insert(dataToInsert).select();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Profile creation failed: No data returned');
  }

  return data[0];
}
