// Maximum avatar file size (2MB)
export const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Allowed image mime types
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Supabase storage bucket name
export const AVATAR_BUCKET = 'avatars';
export const SOCIAL_POST_BUCKET = 'social';

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
