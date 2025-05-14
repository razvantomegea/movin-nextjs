import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client for browser usage
export function createSupabaseClientBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export function getClient() {
  const token = localStorage.getItem('auth_token');
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
