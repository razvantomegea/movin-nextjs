import { createSupabaseClientBrowser } from './createClient';
import {
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  formatFileSize,
  getStorageConfig as getStorageConfigBase,
  AVATAR_BUCKET,
} from './storageConstants';

// Dynamic import for server-side client to avoid bundling server code in client
// Will only be used on server side
const createSupabaseClientServer:
  | typeof import('./createServerClient').createSupabaseClientServer
  | null = null;

// Re-export constants and utilities
export { formatFileSize, getStorageConfigBase as getStorageConfig };

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
 * Uploads an avatar image to Supabase Storage
 * Client-side implementation
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

  // Use client-side only for browser environments
  const client = createSupabaseClientBrowser();

  try {
    // Create a unique file path using the userId (address) as a folder and a timestamp for the file name
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    // Upload the file to the avatars bucket
    const { data, error } = await client.storage.from(AVATAR_BUCKET).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Avatar upload failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('Upload completed but no data was returned');
    }

    // Get the public URL for the uploaded file
    const { data: urlData } = client.storage.from(AVATAR_BUCKET).getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Detailed upload error:', error);

    // Provide more specific error message to help debugging
    if (error instanceof Error) {
      if (error.message.includes('jwt malformed') || error.message.includes('Unauthorized')) {
        throw new Error(
          'Authentication failed. Please try logging in again or use the server action instead.',
        );
      }
      throw error;
    }

    throw new Error('Unknown error during upload');
  }
}
