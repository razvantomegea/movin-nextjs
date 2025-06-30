import { SupabaseClient } from '@supabase/supabase-js';
import { getClient } from './createClient';

export type ConnectionStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface IConnection {
  id: string;
  requester_address: string;
  addressee_address: string;
  status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  // Joined profile data
  requester_profile?: {
    username: string;
    avatar_url: string;
  };
  addressee_profile?: {
    username: string;
    avatar_url: string;
  };
}

export interface IConnectionUser {
  address: string;
  username: string;
  avatar_url: string;
  connection_status?: ConnectionStatus;
  connection_id?: string;
}

/**
 * Send a connection request
 */
export async function sendConnectionRequest({
  requesterAddress,
  addresseeAddress,
  client,
}: {
  requesterAddress: string;
  addresseeAddress: string;
  client?: SupabaseClient;
}): Promise<IConnection> {
  if (!client) {
    client = getClient();
  }

  if (requesterAddress === addresseeAddress) {
    throw new Error('Cannot send connection request to yourself');
  }

  const { data, error } = await client
    .from('connections')
    .insert({
      requester_address: requesterAddress,
      addressee_address: addresseeAddress,
      status: 'pending',
    })
    .select(
      `
      *,
      requester_profile:profiles!connections_requester_address_fkey (
        username,
        avatar_url
      ),
      addressee_profile:profiles!connections_addressee_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Accept a connection request
 */
export async function acceptConnectionRequest({
  connectionId,
  addresseeAddress,
  client,
}: {
  connectionId: string;
  addresseeAddress: string;
  client?: SupabaseClient;
}): Promise<IConnection> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('connections')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', connectionId)
    .eq('addressee_address', addresseeAddress) // Ensure only addressee can accept
    .select(
      `
      *,
      requester_profile:profiles!connections_requester_address_fkey (
        username,
        avatar_url
      ),
      addressee_profile:profiles!connections_addressee_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Decline a connection request
 */
export async function declineConnectionRequest({
  connectionId,
  addresseeAddress,
  client,
}: {
  connectionId: string;
  addresseeAddress: string;
  client?: SupabaseClient;
}): Promise<IConnection> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('connections')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', connectionId)
    .eq('addressee_address', addresseeAddress) // Ensure only addressee can decline
    .select(
      `
      *,
      requester_profile:profiles!connections_requester_address_fkey (
        username,
        avatar_url
      ),
      addressee_profile:profiles!connections_addressee_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Block a user
 */
export async function blockUser({
  connectionId,
  userAddress,
  client,
}: {
  connectionId: string;
  userAddress: string;
  client?: SupabaseClient;
}): Promise<IConnection> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('connections')
    .update({ status: 'blocked', updated_at: new Date().toISOString() })
    .eq('id', connectionId)
    .or(`requester_address.eq.${userAddress},addressee_address.eq.${userAddress}`)
    .select(
      `
      *,
      requester_profile:profiles!connections_requester_address_fkey (
        username,
        avatar_url
      ),
      addressee_profile:profiles!connections_addressee_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Remove/cancel a connection
 */
export async function removeConnection({
  connectionId,
  userAddress,
  client,
}: {
  connectionId: string;
  userAddress: string;
  client?: SupabaseClient;
}): Promise<void> {
  if (!client) {
    client = getClient();
  }

  const { error } = await client
    .from('connections')
    .delete()
    .eq('id', connectionId)
    .or(`requester_address.eq.${userAddress},addressee_address.eq.${userAddress}`);

  if (error) {
    throw error;
  }
}

/**
 * Get user's connections (accepted connections)
 */
export async function getUserConnections({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<IConnectionUser[]> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('connections')
    .select(
      `
      *,
      requester_profile:profiles!connections_requester_address_fkey (
        username,
        avatar_url
      ),
      addressee_profile:profiles!connections_addressee_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .eq('status', 'accepted')
    .or(`requester_address.eq.${address},addressee_address.eq.${address}`);

  if (error) {
    throw error;
  }

  // Transform to get the connected user's information
  const connections: IConnectionUser[] = (data || []).map((conn) => {
    const isRequester = conn.requester_address === address;
    const connectedProfile = isRequester ? conn.addressee_profile : conn.requester_profile;
    const connectedAddress = isRequester ? conn.addressee_address : conn.requester_address;

    return {
      address: connectedAddress,
      username: connectedProfile?.username || '',
      avatar_url: connectedProfile?.avatar_url || '',
      connection_status: conn.status,
      connection_id: conn.id,
    };
  });

  return connections;
}

/**
 * Get pending connection requests (both sent and received)
 */
export async function getPendingConnections({
  address,
  client,
}: {
  address: string;
  client?: SupabaseClient;
}): Promise<{
  sent: IConnection[];
  received: IConnection[];
}> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('connections')
    .select(
      `
      *,
      requester_profile:profiles!connections_requester_address_fkey (
        username,
        avatar_url
      ),
      addressee_profile:profiles!connections_addressee_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .eq('status', 'pending')
    .or(`requester_address.eq.${address},addressee_address.eq.${address}`);

  if (error) {
    throw error;
  }

  const sent = (data || []).filter((conn) => conn.requester_address === address);
  const received = (data || []).filter((conn) => conn.addressee_address === address);

  return { sent, received };
}

/**
 * Search for users to connect with
 */
export async function searchUsers({
  currentUserAddress,
  searchTerm,
  limit = 20,
  client,
}: {
  currentUserAddress: string;
  searchTerm: string;
  limit?: number;
  client?: SupabaseClient;
}): Promise<IConnectionUser[]> {
  if (!client) {
    client = getClient();
  }

  // First, get all existing connections for the current user
  const { data: connections, error: connectionsError } = await client
    .from('connections')
    .select('requester_address, addressee_address, status, id')
    .or(`requester_address.eq.${currentUserAddress},addressee_address.eq.${currentUserAddress}`);

  if (connectionsError) {
    throw connectionsError;
  }

  // Create a map of existing connections
  const connectionMap = new Map<string, { status: ConnectionStatus; id: string }>();
  (connections || []).forEach((conn) => {
    const otherAddress =
      conn.requester_address === currentUserAddress
        ? conn.addressee_address
        : conn.requester_address;
    connectionMap.set(otherAddress, { status: conn.status, id: conn.id });
  });

  // Search for users by username or address
  const { data: users, error: usersError } = await client
    .from('profiles')
    .select('address, username, avatar_url')
    .or(`username.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%`)
    .neq('address', currentUserAddress) // Exclude current user
    .limit(limit);

  if (usersError) {
    throw usersError;
  }

  // Add connection status to each user
  const usersWithConnectionStatus: IConnectionUser[] = (users || []).map((user) => {
    const connection = connectionMap.get(user.address);
    return {
      address: user.address,
      username: user.username,
      avatar_url: user.avatar_url,
      connection_status: connection?.status,
      connection_id: connection?.id,
    };
  });

  return usersWithConnectionStatus;
}

/**
 * Get connection status between two users
 */
export async function getConnectionStatus({
  userAddress1,
  userAddress2,
  client,
}: {
  userAddress1: string;
  userAddress2: string;
  client?: SupabaseClient;
}): Promise<{
  connection: IConnection | null;
  status: ConnectionStatus | null;
}> {
  if (!client) {
    client = getClient();
  }

  const { data, error } = await client
    .from('connections')
    .select(
      `
      *,
      requester_profile:profiles!connections_requester_address_fkey (
        username,
        avatar_url
      ),
      addressee_profile:profiles!connections_addressee_address_fkey (
        username,
        avatar_url
      )
    `,
    )
    .or(
      `and(requester_address.eq.${userAddress1},addressee_address.eq.${userAddress2}),and(requester_address.eq.${userAddress2},addressee_address.eq.${userAddress1})`,
    )
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return { connection: null, status: null }; // No connection found
    }
    throw error;
  }

  return { connection: data, status: data?.status || null };
}
