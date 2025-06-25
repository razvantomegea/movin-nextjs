import { formatDuration } from '../formatDuration';

describe('formatDuration', () => {
  it('returns empty string for null or undefined', () => {
    expect(formatDuration(null)).toBe('');
    expect(formatDuration(undefined)).toBe('');
  });

  it('formats seconds less than 3600 as minutes', () => {
    expect(formatDuration(60)).toBe('1 min');
    expect(formatDuration(3599)).toBe('60 min');
  });

  it('formats seconds >= 3600 as HH:MM:SS', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
    expect(formatDuration(7200)).toBe('2:00:00');
  });

  it('formats seconds between 60 and 3599 as MM:SS if hours is 0', () => {
    expect(formatDuration(125)).toBe('2 min');
  });
});
