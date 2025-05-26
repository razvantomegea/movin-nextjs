import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance for the browser client
let browserClientInstance: SupabaseClient | null = null;

// Client-side Supabase client for browser usage - singleton implementation
export function createSupabaseClientBrowser() {
  // Return existing instance if available
  if (browserClientInstance) {
    return browserClientInstance;
  }

  // Extract token from cookies if available
  let authToken = '';
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/supabase-auth-token=([^;]+)/);
    if (match && match[1]) {
      try {
        // The cookie may contain the full token or be encoded
        authToken = decodeURIComponent(match[1]);
      } catch (e) {
        console.error('Error decoding auth token from cookies:', e);
      }
    }
  }

  // Create a new instance if none exists
  browserClientInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        // Get any existing bearer token from cookie
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : '',
        },
      },
    },
  );

  return browserClientInstance;
}

// Singleton instance for the authenticated client
let authenticatedClientInstance: SupabaseClient | null = null;

export function getClient() {
  // For explicit token usage (legacy method)
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) throw new Error('No auth token');

  // Check if we already have a client with this token
  if (authenticatedClientInstance) {
    return authenticatedClientInstance;
  }

  // Create a new authenticated client
  authenticatedClientInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    },
  );

  return authenticatedClientInstance;
}
