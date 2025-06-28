import { extractDateFromText } from '../extractDateFromText';

describe('extractDateFromText', () => {
  it('extracts YYYY-MM-DD', () => {
    expect(extractDateFromText('workout-2024-06-15.png')).toBe('2024-06-15');
  });

  it('extracts YYYY_MM_DD', () => {
    expect(extractDateFromText('screenshot_2024_06_15.jpg')).toBe('2024-06-15');
  });

  it('extracts YYYYMMDD', () => {
    expect(extractDateFromText('activity20240615.jpeg')).toBe('2024-06-15');
  });

  it('returns null for invalid date', () => {
    expect(extractDateFromText('file-2024-13-40.png')).toBeNull();
  });

  it('returns null if no date present', () => {
    expect(extractDateFromText('nodatehere.txt')).toBeNull();
  });

  it('extracts first valid date if multiple present', () => {
    expect(extractDateFromText('20240615_and_20240510.png')).toBe('2024-06-15');
  });
});
