import { getMetricStats } from './getMetricStats';

describe('getMetricStats', () => {
  const sampleData = [
    { weight: 50, volume: 1000, reps: 10 },
    { weight: 55, volume: 1200, reps: 12 },
    { weight: 60, volume: 1500, reps: 15 },
  ];

  it('calculates stats for weight', () => {
    const stats = getMetricStats(sampleData, 'weight', 'kg');
    expect(stats.current).toBe(60);
    expect(stats.best).toBe(60);
    expect(Math.round(stats.improvement)).toBe(20); // (60-50)/50*100 = 20%
    expect(stats.unit).toBe('kg');
  });

  it('calculates stats for volume', () => {
    const stats = getMetricStats(sampleData, 'volume', 'kg');
    expect(stats.current).toBe(1500);
    expect(stats.best).toBe(1500);
    expect(Math.round(stats.improvement)).toBe(50); // (1500-1000)/1000*100 = 50%
    expect(stats.unit).toBe('kg');
  });

  it('calculates stats for reps', () => {
    const stats = getMetricStats(sampleData, 'reps');
    expect(stats.current).toBe(15);
    expect(stats.best).toBe(15);
    expect(Math.round(stats.improvement)).toBe(50); // (15-10)/10*100 = 50%
    expect(stats.unit).toBe('reps');
  });

  it('returns zeros for empty data', () => {
    const stats = getMetricStats([], 'weight', 'kg');
    expect(stats).toEqual({ current: 0, best: 0, improvement: 0, unit: '' });
  });

  it('handles data with undefined or null values', () => {
    const data = [
      { weight: 50 },
      { weight: undefined },
      { weight: null },
      { weight: 60 },
      { weight: NaN },
    ];
    const stats = getMetricStats(data, 'weight', 'kg');
    expect(stats.current).toBe(60);
    expect(stats.best).toBe(60);
    expect(Math.round(stats.improvement)).toBe(20); // (60-50)/50*100 = 20%
    expect(stats.unit).toBe('kg');
  });

  it('calculates negative improvement when current < first', () => {
    const data = [{ reps: 20 }, { reps: 15 }, { reps: 10 }];
    const stats = getMetricStats(data, 'reps');
    expect(stats.current).toBe(10);
    expect(stats.best).toBe(20);
    expect(Math.round(stats.improvement)).toBe(-50); // (10-20)/20*100 = -50%
    expect(stats.unit).toBe('reps');
  });

  it('handles single data point', () => {
    const data = [{ volume: 1000 }];
    const stats = getMetricStats(data, 'volume', 'kg');
    expect(stats.current).toBe(1000);
    expect(stats.best).toBe(1000);
    expect(stats.improvement).toBe(0); // (1000-1000)/1000*100 = 0%
    expect(stats.unit).toBe('kg');
  });

  it('handles all identical values', () => {
    const data = [{ weight: 70 }, { weight: 70 }, { weight: 70 }];
    const stats = getMetricStats(data, 'weight', 'kg');
    expect(stats.current).toBe(70);
    expect(stats.best).toBe(70);
    expect(stats.improvement).toBe(0); // (70-70)/70*100 = 0%
    expect(stats.unit).toBe('kg');
  });
});
