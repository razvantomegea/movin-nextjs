import { filterDataByTimeRange, getTickValues, formatTick } from '../timeRangeUtils';

// Mock data for tests
const mockWeekData = [
  { label: 'Mon', value: 10 },
  { label: 'Tue', value: 20 },
  { label: 'Wed', value: 30 },
  { label: 'Thu', value: 40 },
  { label: 'Fri', value: 50 },
  { label: 'Sat', value: 60 },
  { label: 'Sun', value: 70 },
];

const mockMonthData = Array.from({ length: 31 }, (_, i) => ({
  label: (i + 1).toString(),
  value: (i + 1) * 10,
}));

const mockYearData = [
  { label: 'Jan', value: 100 },
  { label: 'Feb', value: 200 },
  { label: 'Mar', value: 300 },
  { label: 'Apr', value: 400 },
  { label: 'May', value: 500 },
  { label: 'Jun', value: 600 },
  { label: 'Jul', value: 700 },
  { label: 'Aug', value: 800 },
  { label: 'Sep', value: 900 },
  { label: 'Oct', value: 1000 },
  { label: 'Nov', value: 1100 },
  { label: 'Dec', value: 1200 },
];

describe('timeRangeUtils', () => {
  // Mock date to always return Thursday, June 15, 2023
  const mockDate = new Date('2023-06-15T12:00:00Z');
  const originalDate = global.Date;

  beforeEach(() => {
    global.Date = class extends Date {
      constructor(date?: string | number | Date) {
        if (date) {
          super(date);
        } else {
          super(mockDate.getTime());
        }
      }
    } as any;

    // Also mock Date.now() to return the mock date value
    jest.spyOn(Date, 'now').mockImplementation(() => mockDate.getTime());
  });

  afterEach(() => {
    global.Date = originalDate;
    jest.restoreAllMocks();
  });

  describe('filterDataByTimeRange', () => {
    it('should filter week data correctly', () => {
      const result = filterDataByTimeRange(mockWeekData, 'week');
      // Thursday is day 4 (0-indexed), so we should get days 0-3 (Mon-Thu)
      expect(result.length).toBe(4);
      expect(result[0].label).toBe('Mon');
      expect(result[3].label).toBe('Thu');
    });

    it('should filter month data correctly', () => {
      const result = filterDataByTimeRange(mockMonthData, 'month');
      // The 15th day of the month, so we should get days 1-15
      expect(result.length).toBe(15);
      expect(result[0].label).toBe('1');
      expect(result[14].label).toBe('15');
    });

    it('should filter year data correctly', () => {
      const result = filterDataByTimeRange(mockYearData, 'year');
      // June is month 5 (0-indexed), so we should get months 0-5 (Jan-Jun)
      expect(result.length).toBe(6);
      expect(result[0].label).toBe('Jan');
      expect(result[5].label).toBe('Jun');
    });

    it('should return the original data if timeRange is invalid', () => {
      const result = filterDataByTimeRange(mockWeekData, 'invalid' as any);
      expect(result).toEqual(mockWeekData);
    });
  });

  describe('getTickValues', () => {
    it('should get week tick values correctly', () => {
      const result = getTickValues('week');
      // Thursday is day 4 (0-indexed), so we should get days 0-3 (Mon-Thu)
      expect(result.length).toBe(4);
      expect(result[0]).toBe('Mon');
      expect(result[3]).toBe('Thu');
    });

    it('should get month tick values correctly', () => {
      const result = getTickValues('month');
      // The 15th day of the month, so we should get days 1-15
      expect(result.length).toBe(15);
      expect(result[0]).toBe('1');
      expect(result[14]).toBe('15');
    });

    it('should get year tick values correctly', () => {
      const result = getTickValues('year');
      // June is month 5 (0-indexed), so we should get months 0-5 (Jan-Jun)
      expect(result.length).toBe(6);
      expect(result[0]).toBe('Jan');
      expect(result[5]).toBe('Jun');
    });

    it('should return an empty array if timeRange is invalid', () => {
      const result = getTickValues('invalid' as any);
      expect(result).toEqual([]);
    });
  });

  describe('formatTick', () => {
    it('should format week ticks correctly', () => {
      const ticks = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

      // Non-last tick should remain unchanged
      expect(formatTick({ value: 'Wed', index: 1, allTicks: ticks, timeRange: 'week' })).toBe(
        'Wed',
      );

      // Future days can return either an empty string or the current day (depending on if it's the last tick)
      const fridayResult = formatTick({
        value: 'Fri',
        index: 4,
        allTicks: ticks,
        timeRange: 'week',
      });
      expect(['', 'Thu']).toContain(fridayResult);

      // Last tick with a day before current day should return the current day
      expect(formatTick({ value: 'Wed', index: 4, allTicks: ticks, timeRange: 'week' })).toBe(
        'Thu',
      );
    });

    it('should format month ticks correctly', () => {
      const ticks = ['10', '11', '12', '13', '14', '15', '16'];

      // Non-last tick should remain unchanged
      expect(formatTick({ value: '12', index: 2, allTicks: ticks, timeRange: 'month' })).toBe('12');

      // Future dates can return either an empty string or the current date (depending on if it's the last tick)
      const day16Result = formatTick({
        value: '16',
        index: 6,
        allTicks: ticks,
        timeRange: 'month',
      });
      expect(['', '15']).toContain(day16Result);

      // Last tick with a date before current date should return the current date
      expect(formatTick({ value: '14', index: 6, allTicks: ticks, timeRange: 'month' })).toBe('15');
    });

    it('should format year ticks correctly', () => {
      const ticks = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jul'];

      // Non-last tick should remain unchanged
      expect(formatTick({ value: 'Mar', index: 2, allTicks: ticks, timeRange: 'year' })).toBe(
        'Mar',
      );

      // Future months can return either an empty string or the current month (depending on if it's the last tick)
      const julyResult = formatTick({ value: 'Jul', index: 5, allTicks: ticks, timeRange: 'year' });
      expect(['', 'Jun']).toContain(julyResult);

      // Last tick with a month before current month should return the current month
      expect(formatTick({ value: 'May', index: 5, allTicks: ticks, timeRange: 'year' })).toBe(
        'Jun',
      );
    });
  });
});
