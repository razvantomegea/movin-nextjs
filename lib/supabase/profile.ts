import { createSupabaseClientBrowser } from './createClient';

export interface IProfile {
  id: string;
  username: string;
  email: string;
  address: string;
  avatar_url: string;
  level: number;
  streak_days: number;
  created_at: string;
  updated_at: string;
}

export async function getProfile({
  address,
  client,
}: {
  address: string;
  client?: Awaited<ReturnType<typeof createSupabaseClientBrowser>>;
}): Promise<IProfile | null> {
  if (!client) {
    client = await createSupabaseClientBrowser();
  }

  const { data, error } = await client.from('profiles').select('*').eq('address', address);

  if (error) {
    throw error;
  }

  return data[0] || null;
}

export async function updateProfile({
  address,
  profileData,
}: {
  address: string;
  profileData: Partial<IProfile>;
}): Promise<IProfile> {
  const client = await createSupabaseClientBrowser();

  const existingProfile = await getProfile({ address, client });

  if (existingProfile) {
    const { data, error } = await client
      .from('profiles')
      .update(profileData)
      .eq('address', address);

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error('Profile update failed: No data returned');
    }

    return data[0];
  }

  const dataToInsert: Partial<IProfile> = {
    address,
    email: profileData.email || '',
    username: profileData.username || '',
    avatar_url: profileData.avatar_url || '',
    level: profileData.level || 1,
    streak_days: profileData.streak_days || 0,
  };

  const { data, error } = await client.from('profiles').insert(dataToInsert);

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Profile update failed: No data returned');
  }

  return data[0];
}
