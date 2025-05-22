export function formatDistance(meters?: number | null): string {
  if (meters == null) return '';

  if (meters === 0) return '0m';

  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}
