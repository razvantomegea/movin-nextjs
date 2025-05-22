import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client for browser usage
export function createSupabaseClientBrowser() {
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

  // Basic Supabase client for unauthenticated actions or when token is in cookie
  return createClient(
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
}

export function getClient() {
  // For explicit token usage (legacy method)
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) throw new Error('No auth token');

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    },
  );
}
