import { createSupabaseClientBrowser } from './createClient';

// Maximum avatar file size (2MB)
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Allowed image mime types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Supabase storage bucket name
const AVATAR_BUCKET = 'avatars';

/**
 * Check if a file is valid for avatar upload
 * @param file - The file to validate
 * @returns An object containing validation information
 */
export function validateAvatarFile(file: File): {
  isValid: boolean;
  errorMessage?: string;
  sizeInfo: string;
  sizeInBytes: number;
  isSizeOk: boolean;
  mimeType: string;
  isTypeOk: boolean;
} {
  const sizeInBytes = file.size;
  const mimeType = file.type;

  // Check file size
  const isSizeOk = sizeInBytes <= MAX_FILE_SIZE;

  // Check file type
  const isTypeOk = ALLOWED_MIME_TYPES.includes(mimeType);

  // Format size for display
  const sizeInfo = formatFileSize(sizeInBytes);

  // Overall validity
  const isValid = isSizeOk && isTypeOk;

  // Error message if not valid
  let errorMessage;
  if (!isSizeOk) {
    errorMessage = `File size exceeds the limit of ${formatFileSize(MAX_FILE_SIZE)}`;
  } else if (!isTypeOk) {
    errorMessage = 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.';
  }

  return {
    isValid,
    errorMessage,
    sizeInfo,
    sizeInBytes,
    isSizeOk,
    mimeType,
    isTypeOk,
  };
}

/**
 * Format file size in human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get storage configuration information
 * @returns Configuration info including max file size and allowed types
 */
export function getStorageConfig() {
  return {
    maxFileSize: MAX_FILE_SIZE,
    maxFileSizeFormatted: formatFileSize(MAX_FILE_SIZE),
    allowedMimeTypes: ALLOWED_MIME_TYPES,
  };
}

/**
 * Ensures that the avatars bucket exists in Supabase storage
 * @param client - Supabase client instance
 */
async function ensureAvatarBucketExists(client: ReturnType<typeof createSupabaseClientBrowser>) {
  try {
    // Check if bucket exists
    const { data: buckets } = await client.storage.listBuckets();
    const bucketExists = buckets?.some((bucket: { name: string }) => bucket.name === AVATAR_BUCKET);

    // Create bucket if it doesn't exist
    if (!bucketExists) {
      await client.storage.createBucket(AVATAR_BUCKET, {
        public: true, // Set bucket to public for easy access to avatar images
      });
    }
  } catch (error) {
    console.error('Error ensuring avatar bucket exists:', error);
    // Continue with the upload as the bucket might already exist
    // or the user might not have permissions to list/create buckets
  }
}

/**
 * Uploads an avatar image to Supabase Storage
 * @param file - The file to upload
 * @param userId - The user ID to associate with the avatar
 * @returns The public URL of the uploaded avatar
 */
export async function uploadAvatar(file: File, userId: string): Promise<string> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds the limit of ${formatFileSize(MAX_FILE_SIZE)}`);
  }

  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.');
  }

  const client = createSupabaseClientBrowser();

  // Ensure the avatars bucket exists
  await ensureAvatarBucketExists(client);

  // Create a unique file name using the user ID and timestamp
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}_${Date.now()}.${fileExt}`;

  // Upload the file to the avatars bucket
  const { data, error } = await client.storage.from(AVATAR_BUCKET).upload(fileName, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }

  // Get the public URL for the uploaded file
  const { data: urlData } = client.storage.from(AVATAR_BUCKET).getPublicUrl(data.path);

  return urlData.publicUrl;
}
