import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

export interface IPushSubscription {
  id: string;
  address: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface IPushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Get all active push subscriptions for a specific address
 */
export async function getUserPushSubscriptions({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IPushSubscription[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('push_subscriptions')
    .select()
    .eq('address', address)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data as IPushSubscription[]) || [];
}

/**
 * Get all push subscriptions (including inactive) for a specific address
 */
export async function getAllUserPushSubscriptions({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IPushSubscription[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('push_subscriptions')
    .select()
    .eq('address', address)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }
  return (data as IPushSubscription[]) || [];
}

/**
 * Create or update a push subscription
 */
export async function upsertPushSubscription({
  address,
  subscriptionData,
  userAgent,
  client,
}: {
  address: string;
  subscriptionData: IPushSubscriptionPayload;
  userAgent?: string;
  client?: SupabaseClient;
}): Promise<IPushSubscription> {
  if (!client) {
    client = getClient();
  }

  if (!address) {
    throw new Error('Address is required to create push subscription');
  }

  if (
    !subscriptionData.endpoint ||
    !subscriptionData.keys?.p256dh ||
    !subscriptionData.keys?.auth
  ) {
    throw new Error('Invalid subscription data: endpoint and keys are required');
  }

  const dataToUpsert = {
    address: address.toLowerCase(),
    endpoint: subscriptionData.endpoint,
    p256dh: subscriptionData.keys.p256dh,
    auth: subscriptionData.keys.auth,
    user_agent: userAgent,
    is_active: true,
  };

  // Use upsert to handle both insert and update cases
  const { data, error } = await client
    .from('push_subscriptions')
    .upsert(dataToUpsert, {
      onConflict: 'address, endpoint',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Deactivate a push subscription by endpoint
 */
export async function deactivatePushSubscription({
  address,
  endpoint,
  client,
}: {
  address: string;
  endpoint: string;
  client?: SupabaseClient;
}): Promise<IPushSubscription | null> {
  if (!client) {
    client = getClient();
  }

  if (!address || !endpoint) {
    throw new Error('Address and endpoint are required to deactivate push subscription');
  }

  const { data, error } = await client
    .from('push_subscriptions')
    .update({ is_active: false })
    .eq('address', address.toLowerCase())
    .eq('endpoint', endpoint)
    .select()
    .single();

  if (error) {
    // If no matching subscription found, that's okay
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Permanently delete a push subscription
 */
export async function deletePushSubscription({
  address,
  endpoint,
  client,
}: {
  address: string;
  endpoint: string;
  client?: SupabaseClient;
}): Promise<void> {
  if (!client) {
    client = getClient();
  }

  if (!address || !endpoint) {
    throw new Error('Address and endpoint are required to delete push subscription');
  }

  const { error } = await client
    .from('push_subscriptions')
    .delete()
    .eq('address', address.toLowerCase())
    .eq('endpoint', endpoint);

  if (error) {
    throw error;
  }
}

/**
 * Get a specific push subscription by endpoint and address
 */
export async function getPushSubscription({
  address,
  endpoint,
  client,
}: {
  address: string;
  endpoint: string;
  client?: SupabaseClient;
}): Promise<IPushSubscription | null> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('push_subscriptions')
    .select()
    .eq('address', address.toLowerCase())
    .eq('endpoint', endpoint)
    .single();

  if (error) {
    // If no matching subscription found, return null
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Reactivate a push subscription
 */
export async function reactivatePushSubscription({
  address,
  endpoint,
  client,
}: {
  address: string;
  endpoint: string;
  client?: SupabaseClient;
}): Promise<IPushSubscription | null> {
  if (!client) {
    client = getClient();
  }

  if (!address || !endpoint) {
    throw new Error('Address and endpoint are required to reactivate push subscription');
  }

  const { data, error } = await client
    .from('push_subscriptions')
    .update({ is_active: true })
    .eq('address', address.toLowerCase())
    .eq('endpoint', endpoint)
    .select()
    .single();

  if (error) {
    // If no matching subscription found, that's okay
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}

/**
 * Get count of active subscriptions for a user
 */
export async function getUserPushSubscriptionCount({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<number> {
  if (!client) {
    client = getClient();
  }

  const { count, error } = await client
    .from('push_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('address', address.toLowerCase())
    .eq('is_active', true);

  if (error) {
    throw error;
  }

  return count || 0;
}
