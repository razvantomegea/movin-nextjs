import { formatTimeAgo } from '../formatTimeAgo';

describe('formatTimeAgo', () => {
  const now = new Date('2024-06-01T12:00:00Z');
  const realDateNow = Date.now;
  beforeAll(() => {
    // Mock Date.now to return a fixed time
    Date.now = () => now.getTime();
  });
  afterAll(() => {
    Date.now = realDateNow;
  });

  it('returns "Just now" for less than 1 minute', () => {
    const date = new Date(now.getTime() - 30 * 1000).toISOString();
    expect(formatTimeAgo(date, now)).toBe('Just now');
  });

  it('returns Xm ago for minutes', () => {
    const date = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    expect(formatTimeAgo(date, now)).toBe('5m ago');
  });

  it('returns Xh ago for hours', () => {
    const date = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(date, now)).toBe('3h ago');
  });

  it('returns Xd ago for days', () => {
    const date = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatTimeAgo(date, now)).toBe('2d ago');
  });

  it('returns date string for more than 7 days', () => {
    const date = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
    // Should match toLocaleDateString of the input date
    expect(formatTimeAgo(date, now)).toBe(new Date(date).toLocaleDateString());
  });
});
