'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { uploadAvatarServer } from '@/lib/supabase/serverStorage';

/**
 * Update a user's profile avatar using server-side upload
 */
export async function updateProfileAvatar(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      throw new Error('Missing file or user ID');
    }

    // Upload avatar through server-side function
    const avatarUrl = await uploadAvatarServer(file, userId);

    // Update user profile with new avatar URL
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
        auth: {
          persistSession: false,
        },
      },
    );

    // Update profile with new avatar URL
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('address', userId);

    if (error) {
      console.error('Failed to update profile:', error);
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return { success: true, avatarUrl };
  } catch (error) {
    console.error('Avatar update error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
