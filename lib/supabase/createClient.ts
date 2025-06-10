import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Global singleton instance - only one client per browser context
let globalSupabaseInstance: SupabaseClient | null = null;

// Ensure we only create one instance across the entire application
function getGlobalSupabaseClient(): SupabaseClient {
  // Return existing instance if available
  if (globalSupabaseInstance) {
    return globalSupabaseInstance;
  }

  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('This function should only be called on the client side');
  }

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating new Supabase client instance');
    // Import debug function only in development to avoid bundle bloat
    import('./debug').then(({ trackClientCreation }) => {
      trackClientCreation();
    });
  }

  // Create a new instance only if none exists
  globalSupabaseInstance = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'movin-auth', // Use a unique storage key for your app
        flowType: 'pkce', // Use PKCE flow for better security
      },
      global: {
        headers: {
          'X-Client-Info': 'movin-nextjs@1.0.0',
        },
      },
    },
  );

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase client created successfully');
  }

  return globalSupabaseInstance;
}

// Browser client - uses the global singleton
export function createSupabaseClientBrowser() {
  return getGlobalSupabaseClient();
}

// Legacy function for backward compatibility - updated to use modern auth pattern
export function getClient() {
  // Use the same global client but ensure we have an authenticated session
  const client = getGlobalSupabaseClient();

  // Check if we have an active session
  const session = client.auth.getSession();
  if (!session) {
    // For explicit token usage (legacy method), try to get from localStorage
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      throw new Error('No auth token - user must be logged in');
    }

    // If we have a stored token but no session, the token might be outdated
    // In this case, recommend using the modern auth flow instead
    console.warn(
      'Using legacy auth token. Consider migrating to Supabase auth session management.',
    );
  }

  return client;
}

// Helper function to check if client is initialized (for debugging)
export function isClientInitialized(): boolean {
  return globalSupabaseInstance !== null;
}

// Helper function to reset client (for testing/debugging only)
export function resetClient(): void {
  if (process.env.NODE_ENV === 'development') {
    globalSupabaseInstance = null;
  }
}
