/**
 * Format a date to a readable string
 * @param timestamp - Timestamp to format
 * @returns Formatted date string
 */
export function formatDate(timestamp: number | string | Date): string {
  if (!timestamp) return '';

  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    console.error('Error formatting date:', e);
    return '';
  }
}

/**
 * Format time remaining until unlock in days, hours, minutes
 * @param unlockTime - Seconds remaining until unlock
 * @returns Human-readable time remaining
 */
export function formatTimeRemaining(unlockTime: number | null | undefined): string {
  if (!unlockTime || unlockTime <= 0) return 'Not locked';

  // Calculate remaining time in seconds
  const seconds = unlockTime;

  if (seconds <= 0) return 'Unlocked';

  // Convert to days, hours, minutes
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);

  // Format the output
  let result = '';
  if (days > 0) result += `${days} day${days > 1 ? 's' : ''} `;
  if (hours > 0 || days > 0) result += `${hours} hour${hours > 1 ? 's' : ''} `;
  result += `${minutes} minute${minutes > 1 ? 's' : ''}`;

  return result;
}

/**
 * Format lock period in a human-readable way
 * @param lockPeriod - Lock period in seconds
 * @returns Formatted lock period (e.g., "3 months")
 */
export function formatLockPeriod(lockPeriod: number | null | undefined): string {
  if (!lockPeriod || lockPeriod <= 0) return 'No lock period';

  // Convert seconds to months (approximate)
  const months = Math.ceil(lockPeriod / (30 * 24 * 60 * 60));

  return `${months} month${months > 1 ? 's' : ''}`;
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date as YYYY-MM-DD string
 */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
