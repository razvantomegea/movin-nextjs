import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Singleton instance for the browser client
let browserClientInstance: SupabaseClient | null = null;

// Client-side Supabase client for browser usage - singleton implementation
// Store the current auth token used to create the instance
let currentAuthToken: string | null = null;

export function createSupabaseClientBrowser() {
  // Extract current token
  let authToken = '';
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/supabase-auth-token=([^;]+)/);
    if (match && match[1]) {
      try {
        authToken = decodeURIComponent(match[1]);
      } catch (e) {
        console.error('Error decoding auth token from cookies:', e);
      }
    }
  }

  // Return existing instance if available
  if (browserClientInstance && currentAuthToken === authToken) {
    return browserClientInstance;
  }

  // Update the stored token
  currentAuthToken = authToken;

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

// Store the token used to create the instance
let currentToken: string | null = null;

export function getClient() {
  // For explicit token usage (legacy method)
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (!token) {
    // Reset singleton if no token
    authenticatedClientInstance = null;
    currentToken = null;
    throw new Error('No auth token');
  }

  // Check if we already have a client with this token
  if (authenticatedClientInstance && currentToken === token) {
    return authenticatedClientInstance;
  }

  // Update the stored token
  currentToken = token;

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

// Helper function to check if client is initialized (for debugging)
export function isClientInitialized(): boolean {
  return browserClientInstance !== null || authenticatedClientInstance !== null;
}

// Helper function to reset client (for testing/debugging only)
export function resetClient(): void {
  if (process.env.NODE_ENV === 'development') {
    browserClientInstance = null;
    authenticatedClientInstance = null;
  }
}
