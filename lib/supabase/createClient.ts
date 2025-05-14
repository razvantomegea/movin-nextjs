import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client for browser usage
export function createSupabaseClientBrowser() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
