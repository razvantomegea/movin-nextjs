'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createSupabaseClientServer() {
  const cookieStore = await cookies();

  // Extract JWT token from cookies
  let authToken = '';
  const authCookie = cookieStore.get('supabase-auth-token');
  if (authCookie?.value) {
    try {
      authToken = decodeURIComponent(authCookie.value);
    } catch (e) {
      console.error('Error decoding auth token from cookies:', e);
    }
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        headers: {
          Authorization: authToken ? `Bearer ${authToken}` : '',
        },
      },
    },
  );
}
