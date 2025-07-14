/**
 * Calculate stats for a given metric from workout/exercise progress data.
 * @template T
 * @param {T[]} data - Array of data points (e.g., chart data or progress history)
 * @param {'weight' | 'volume' | 'reps'} metric - The metric to calculate stats for
 * @param {string} [weightUnit] - The weight unit (e.g., 'kg', 'lbs')
 * @returns {{ current: number; best: number; improvement: number; unit: string }}
 */
export function getMetricStats<T extends Record<string, any>>(
  data: T[],
  metric: 'weight' | 'volume' | 'reps',
  weightUnit?: string,
) {
  if (!data.length) return { current: 0, best: 0, improvement: 0, unit: '' };

  const values = data.map((d) => d[metric]);
  const current = values[values.length - 1] || 0;
  const best = Math.max(...values);
  const first = values[0] || 0;
  const improvement = first > 0 ? ((current - first) / first) * 100 : 0;

  let unit = '';
  if (metric === 'weight' || metric === 'volume') unit = weightUnit || '';
  else if (metric === 'reps') unit = 'reps';

  return { current, best, improvement, unit };
}
