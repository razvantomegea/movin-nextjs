/**
 * Calculate stats for a given metric from workout/exercise progress data.
 * @template T
 * @param {T[]} data - Array of data points (e.g., chart data or progress history)
 * @param {'weight' | 'volume' | 'reps' | 'time_under_tension'} metric - The metric to calculate stats for
 * @param {string} [weightUnit] - The weight unit (e.g., 'kg', 'lbs')
 * @returns {{ current: number; best: number; improvement: number; unit: string }}
 */
export function getMetricStats<T extends Record<string, any>>(
  data: T[],
  metric: 'weight' | 'volume' | 'reps' | 'time_under_tension',
  weightUnit?: string,
) {
  if (!data.length) return { current: 0, best: 0, improvement: 0, unit: '' };

  let values = data.map((d) => d[metric]);
  values = values.filter((v) => typeof v === 'number' && !isNaN(v));
  const current = values[values.length - 1] || 0;
  const best = values.length ? Math.max(...values) : 0;
  const first = values[0] || 0;
  const improvement = first > 0 ? ((current - first) / first) * 100 : 0;

  let unit = '';
  if (metric === 'weight' || metric === 'volume') unit = weightUnit || '';
  else if (metric === 'reps') unit = 'reps';
  else if (metric === 'time_under_tension') unit = 'seconds';
  return { current, best, improvement, unit };
}
