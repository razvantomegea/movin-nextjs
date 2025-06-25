import { formatDistance } from '../formatDistance';

describe('formatDistance', () => {
  it('returns empty string for null or undefined', () => {
    expect(formatDistance(null)).toBe('');
    expect(formatDistance(undefined)).toBe('');
  });

  it('returns 0m for 0', () => {
    expect(formatDistance(0)).toBe('0m');
  });

  it('formats meters less than 1000', () => {
    expect(formatDistance(123)).toBe('123m');
    expect(formatDistance(999)).toBe('999m');
  });

  it('formats meters 1000 or more as km with 1 decimal', () => {
    expect(formatDistance(1000)).toBe('1.0km');
    expect(formatDistance(1500)).toBe('1.5km');
    expect(formatDistance(12345)).toBe('12.3km');
  });
});
