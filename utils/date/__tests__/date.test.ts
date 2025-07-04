import {
  formatDate,
  formatTimeRemaining,
  formatLockPeriod,
  getTodayDate,
  getCurrentDayHour,
} from '../date';

describe('date utils', () => {
  describe('formatDate', () => {
    it('formats a timestamp correctly', () => {
      expect(formatDate(1718000000000)).toMatch(/Jun|Jul|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar|Apr|May/);
    });
    it('formats a string date correctly', () => {
      expect(formatDate('2024-06-15T12:34:00Z')).toContain('2024');
    });
    it('formats a Date object correctly', () => {
      expect(formatDate(new Date('2024-06-15T12:34:00Z'))).toContain('2024');
    });
    it('returns empty string for invalid input', () => {
      expect(formatDate(undefined as any)).toBe('');
      expect(formatDate(null as any)).toBe('');
    });
  });

  describe('formatTimeRemaining', () => {
    it('returns Not locked for null or 0', () => {
      expect(formatTimeRemaining(null)).toBe('Not locked');
      expect(formatTimeRemaining(0)).toBe('Not locked');
    });
    it('returns Unlocked for negative seconds', () => {
      expect(formatTimeRemaining(-10)).toBe('Unlocked');
    });
    it('formats days, hours, minutes', () => {
      // 2 days, 2 hours, 55 minutes = 2*86400 + 2*3600 + 55*60 = 183300
      expect(formatTimeRemaining(183300)).toContain('2 days');
      expect(formatTimeRemaining(183300)).toContain('2 hours');
      expect(formatTimeRemaining(183300)).toContain('55 minutes');
    });
    it('formats only minutes', () => {
      expect(formatTimeRemaining(120)).toBe('0 hour 2 minutes');
    });
  });

  describe('formatLockPeriod', () => {
    it('returns No lock period for null or 0', () => {
      expect(formatLockPeriod(null)).toBe('No lock period');
      expect(formatLockPeriod(0)).toBe('No lock period');
    });
    it('formats months correctly', () => {
      expect(formatLockPeriod(60 * 60 * 24 * 30)).toBe('1 month');
      expect(formatLockPeriod(60 * 60 * 24 * 90)).toBe('3 months');
    });
  });

  describe('getTodayDate', () => {
    it('returns today in YYYY-MM-DD format', () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      expect(getTodayDate()).toBe(`${yyyy}-${mm}-${dd}`);
    });
  });

  describe('getCurrentDayHour', () => {
    it('returns current day and hour in DD HH format', () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      expect(getCurrentDayHour()).toBe(`${day} ${hour}`);
    });
  });
});
