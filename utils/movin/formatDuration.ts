export function formatDuration(seconds?: number | null): string {
  if (seconds == null) return '';

  // For the simple minutes-only format used in activityMappers
  if (seconds < 3600) {
    return `${Math.round(seconds / 60)} min`;
  }

  // For the detailed time format (HH:MM:SS)
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
