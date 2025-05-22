export function formatDistance(meters?: number | null): string {
  if (!meters) return '';

  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}
