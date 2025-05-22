'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  formatFileSize,
  AVATAR_BUCKET,
} from './storageConstants';

/**
 * Uploads an avatar image to Supabase Storage from the server side
 * This should only be called from a Server Action
 * @param file - The file to upload
 * @param userId - The user ID to associate with the avatar
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatarServer(file: File, userId: string): Promise<string> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the limit of ${formatFileSize(MAX_FILE_SIZE)}`);
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  // Create server-side Supabase client
  const cookieStore = await cookies();

  // Use service role key for admin access to bypass RLS policies when running on server
  // WARNING: This is secure only in server components/actions
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
      auth: {
        persistSession: false,
      },
    },
  );

  // Create a unique file path using the userId (address) as a folder and a timestamp for the file name
  const fileExt = file.name.split('.').pop();
  const filePath = `${userId}/${Date.now()}.${fileExt}`;

  // Upload the file to the avatars bucket
  const { data, error } = await client.storage.from(AVATAR_BUCKET).upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    console.error('Storage upload error:', error);
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  // Get the public URL for the uploaded file
  const { data: urlData } = client.storage.from(AVATAR_BUCKET).getPublicUrl(data.path);

  return urlData.publicUrl;
}
