import { calculateBMR, calculateDailyCalories, calculateAge } from '../calculateBMR';

describe('calculateBMR', () => {
  it('calculates BMR for a male with valid inputs', () => {
    expect(calculateBMR(70, 175, 30, 'male')).toBe(1649);
  });

  it('calculates BMR for a female with valid inputs', () => {
    expect(calculateBMR(60, 165, 28, 'female')).toBe(1330);
  });

  it('returns 2000 if any parameter is missing', () => {
    expect(calculateBMR(undefined, 175, 30, 'male')).toBe(2000);
    expect(calculateBMR(70, undefined, 30, 'male')).toBe(2000);
    expect(calculateBMR(70, 175, undefined, 'male')).toBe(2000);
    expect(calculateBMR(70, 175, 30, undefined)).toBe(2000);
  });

  it('throws error for invalid weight', () => {
    expect(() => calculateBMR(10, 175, 30, 'male')).toThrow('Invalid weight');
    expect(() => calculateBMR(400, 175, 30, 'male')).toThrow('Invalid weight');
  });

  it('throws error for invalid height', () => {
    expect(() => calculateBMR(70, 90, 30, 'male')).toThrow('Invalid height');
    expect(() => calculateBMR(70, 300, 30, 'male')).toThrow('Invalid height');
  });

  it('throws error for invalid age', () => {
    expect(() => calculateBMR(70, 175, 10, 'male')).toThrow('Invalid age');
    expect(() => calculateBMR(70, 175, 120, 'male')).toThrow('Invalid age');
  });
});

describe('calculateDailyCalories', () => {
  it('calculates daily calories with default activity level', () => {
    expect(calculateDailyCalories(2000)).toBe(2000);
  });

  it('calculates daily calories with custom activity level', () => {
    expect(calculateDailyCalories(2000, 1.5)).toBe(3000);
  });
});

describe('calculateAge', () => {
  it('returns undefined if dateOfBirth is undefined', () => {
    expect(calculateAge(undefined)).toBeUndefined();
  });

  it('calculates correct age for a past birthday this year', () => {
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 25, today.getMonth() - 1, today.getDate());
    const dob = birthDate.toISOString().split('T')[0];
    expect(calculateAge(dob)).toBe(25);
  });

  it('calculates correct age for a birthday not yet occurred this year', () => {
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - 25, today.getMonth() + 1, today.getDate());
    const dob = birthDate.toISOString().split('T')[0];
    expect(calculateAge(dob)).toBe(24);
  });
});
