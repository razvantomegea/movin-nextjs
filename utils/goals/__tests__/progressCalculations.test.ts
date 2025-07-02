import {
  calculateGoalPeriod,
  calculateCalorieBasedWeightProgress,
  calculateProgressEstimation,
  formatEstimationText,
  type ProgressEstimation,
  type GoalPeriodInfo,
} from '../progressCalculations';
import { IEnergy } from '@/lib/supabase/energy';
import { IActivity } from '@/lib/supabase/activities';
import { IProfile } from '@/lib/supabase/profile';

// Mock data helpers
const createMockProfile = (overrides: Partial<IProfile> = {}): IProfile => ({
  id: 'test-id',
  username: 'testuser',
  email: 'test@example.com',
  address: 'test-address',
  avatar_url: '',
  level: 1,
  streak_days: 0,
  is_premium: false,
  weight: 70,
  weight_unit: 'kg',
  height: 175,
  biological_sex: 'male',
  date_of_birth: '1990-01-01',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createMockEnergyEntry = (overrides: Partial<IEnergy> = {}): IEnergy => ({
  id: 'energy-1',
  address: 'test-address',
  calories: 500,
  protein: 20,
  carbohydrates: 50,
  fats: 15,
  fiber: 5,
  log_date: '2024-01-15',
  meal_name: 'Test Meal',
  created_at: '2024-01-15T12:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
  ...overrides,
});

const createMockActivity = (overrides: Partial<IActivity> = {}): IActivity => ({
  id: 'activity-1',
  address: 'test-address',
  name: 'Running',
  source: 'manual',
  start_date: '2024-01-15T08:00:00Z',
  end_date: '2024-01-15T09:00:00Z',
  duration: 3600,
  total_energy_burned: 300,
  total_distance: 5000,
  total_steps: 6000,
  created_at: '2024-01-15T09:00:00Z',
  updated_at: '2024-01-15T09:00:00Z',
  ...overrides,
});

describe('calculateGoalPeriod', () => {
  beforeEach(() => {
    // Mock current date to 2024-01-15 (Monday)
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('calculates daily period correctly', () => {
    const period = calculateGoalPeriod('daily');

    expect(period.totalDays).toBe(1);
    expect(period.daysElapsed).toBe(1);
    expect(period.daysRemaining).toBe(0);
    expect(period.startDate.toISOString()).toBe('2024-01-15T00:00:00.000Z');
    expect(period.endDate.toISOString()).toBe('2024-01-15T23:59:59.999Z');
  });

  test('calculates weekly period correctly for Monday', () => {
    const period = calculateGoalPeriod('weekly');

    expect(period.totalDays).toBe(7);
    expect(period.daysElapsed).toBe(1);
    expect(period.daysRemaining).toBe(6);
    expect(period.startDate.toISOString()).toBe('2024-01-15T00:00:00.000Z'); // Monday
    expect(period.endDate.toISOString()).toBe('2024-01-21T23:59:59.999Z'); // Sunday
  });

  test('calculates weekly period correctly for Wednesday', () => {
    jest.setSystemTime(new Date('2024-01-17T12:00:00Z')); // Wednesday

    const period = calculateGoalPeriod('weekly');

    expect(period.totalDays).toBe(7);
    expect(period.daysElapsed).toBe(3);
    expect(period.daysRemaining).toBe(4);
    expect(period.startDate.toISOString()).toBe('2024-01-15T00:00:00.000Z'); // Monday
  });

  test('calculates weekly period correctly for Sunday', () => {
    jest.setSystemTime(new Date('2024-01-14T12:00:00Z')); // Sunday

    const period = calculateGoalPeriod('weekly');

    expect(period.totalDays).toBe(7);
    expect(period.daysElapsed).toBe(7);
    expect(period.daysRemaining).toBe(0);
    expect(period.startDate.toISOString()).toBe('2024-01-08T00:00:00.000Z'); // Previous Monday
  });

  test('calculates monthly period correctly for mid-January', () => {
    const period = calculateGoalPeriod('monthly');

    expect(period.totalDays).toBe(31); // January has 31 days
    expect(period.daysElapsed).toBe(15);
    expect(period.daysRemaining).toBe(16);
    expect(period.startDate.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(period.endDate.toISOString()).toBe('2024-01-31T23:59:59.999Z');
  });

  test('calculates monthly period correctly for February (leap year)', () => {
    jest.setSystemTime(new Date('2024-02-15T12:00:00Z')); // February in leap year

    const period = calculateGoalPeriod('monthly');

    expect(period.totalDays).toBe(29); // February 2024 has 29 days (leap year)
    expect(period.daysElapsed).toBe(15);
    expect(period.daysRemaining).toBe(14);
  });
});

describe('calculateCalorieBasedWeightProgress', () => {
  test('calculates weight loss progress correctly', async () => {
    const goalStartDate = new Date('2024-01-10T00:00:00Z');
    const currentWeight = 75;
    const targetWeight = 70; // 5kg weight loss goal

    const energyEntries: IEnergy[] = [
      createMockEnergyEntry({ log_date: '2024-01-12', calories: 2000 }),
      createMockEnergyEntry({ log_date: '2024-01-13', calories: 1800 }),
      createMockEnergyEntry({ log_date: '2024-01-14', calories: 1900 }),
    ];

    const activities: IActivity[] = [
      createMockActivity({ start_date: '2024-01-12T08:00:00Z', total_energy_burned: 400 }),
      createMockActivity({ start_date: '2024-01-13T08:00:00Z', total_energy_burned: 350 }),
    ];

    const profile = createMockProfile({ weight: 75, height: 175, biological_sex: 'male' });

    const result = await calculateCalorieBasedWeightProgress(
      goalStartDate,
      currentWeight,
      targetWeight,
      energyEntries,
      activities,
      profile,
    );

    expect(result.calorieDeficit).toBeGreaterThan(0); // Should have a calorie deficit
    expect(result.weightChangeFromCalories).toBeGreaterThan(0); // Should show weight loss
    expect(result.adjustedProgress).toBeGreaterThan(0);
    expect(result.adjustedProgress).toBeLessThanOrEqual(100);
  });

  test('calculates weight gain progress correctly', async () => {
    // Use fake timers for this test
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-12T12:00:00Z'));

    const goalStartDate = new Date('2024-01-12T00:00:00Z'); // Same day
    const currentWeight = 65;
    const targetWeight = 70; // 5kg weight gain goal

    const energyEntries: IEnergy[] = [
      createMockEnergyEntry({ log_date: '2024-01-12', calories: 4000 }), // Very high calorie intake
    ];

    const activities: IActivity[] = [
      createMockActivity({ start_date: '2024-01-12T08:00:00Z', total_energy_burned: 100 }), // Low activity
    ];

    const profile = createMockProfile({ weight: 65 });

    const result = await calculateCalorieBasedWeightProgress(
      goalStartDate,
      currentWeight,
      targetWeight,
      energyEntries,
      activities,
      profile,
    );

    expect(result.calorieDeficit).toBeLessThan(0); // Should have calorie surplus
    expect(result.weightChangeFromCalories).toBeGreaterThan(0); // Absolute value, direction shown by deficit sign

    jest.useRealTimers();
  });

  test('handles empty energy and activity data', async () => {
    const goalStartDate = new Date('2024-01-10T00:00:00Z');
    const currentWeight = 70;
    const targetWeight = 65;

    const result = await calculateCalorieBasedWeightProgress(
      goalStartDate,
      currentWeight,
      targetWeight,
      [],
      [],
      null,
    );

    expect(result.calorieDeficit).toBeGreaterThan(0); // BMR should still create deficit
    expect(result.adjustedProgress).toBeGreaterThanOrEqual(0);
  });

  test('filters data by goal start date correctly', async () => {
    const goalStartDate = new Date('2024-01-12T00:00:00Z');
    const currentWeight = 70;
    const targetWeight = 65;

    const energyEntries: IEnergy[] = [
      createMockEnergyEntry({ log_date: '2024-01-10', calories: 2000 }), // Before goal start
      createMockEnergyEntry({ log_date: '2024-01-13', calories: 1800 }), // After goal start
    ];

    const activities: IActivity[] = [
      createMockActivity({ start_date: '2024-01-10T08:00:00Z', total_energy_burned: 300 }), // Before goal start
      createMockActivity({ start_date: '2024-01-13T08:00:00Z', total_energy_burned: 400 }), // After goal start
    ];

    const profile = createMockProfile();

    const result = await calculateCalorieBasedWeightProgress(
      goalStartDate,
      currentWeight,
      targetWeight,
      energyEntries,
      activities,
      profile,
    );

    // Should only include data from 2024-01-13 onwards
    expect(result).toBeDefined();
    expect(result.adjustedProgress).toBeGreaterThanOrEqual(0);
  });

  test('handles maintenance weight goals (current equals target)', async () => {
    const goalStartDate = new Date('2024-01-10T00:00:00Z');
    const currentWeight = 75;
    const targetWeight = 75; // Same as current - maintenance goal

    const energyEntries: IEnergy[] = [
      createMockEnergyEntry({ log_date: '2024-01-12', calories: 2000 }),
    ];

    const activities: IActivity[] = [
      createMockActivity({ start_date: '2024-01-12T08:00:00Z', total_energy_burned: 300 }),
    ];

    const profile = createMockProfile({ weight: 75 });

    const result = await calculateCalorieBasedWeightProgress(
      goalStartDate,
      currentWeight,
      targetWeight,
      energyEntries,
      activities,
      profile,
    );

    expect(result.adjustedProgress).toBe(100); // Goal should be 100% achieved
    expect(result).toBeDefined();
    expect(result.calorieDeficit).toBeDefined();
    expect(result.weightChangeFromCalories).toBeDefined();
  });
});

describe('calculateProgressEstimation', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('calculates daily goal estimation correctly', () => {
    const estimation = calculateProgressEstimation(
      75, // current value
      100, // target value
      'daily',
      '2024-01-15T00:00:00Z',
    );

    expect(estimation.currentProgress).toBe(75);
    expect(estimation.progressRate).toBe(75);
    expect(estimation.isOnTrack).toBe(true); // Any progress > 0 is considered on track for daily goals
    expect(estimation.estimatedDaysToCompletion).toBe(1);
  });

  test('calculates weekly goal estimation correctly when on track', () => {
    jest.setSystemTime(new Date('2024-01-17T12:00:00Z')); // Wednesday (day 3 of week)

    const estimation = calculateProgressEstimation(
      60, // current value
      100, // target value
      'weekly',
      '2024-01-15T00:00:00Z',
    );

    expect(estimation.currentProgress).toBe(60);
    expect(estimation.progressRate).toBe(20); // 60% / 3 days
    expect(estimation.isOnTrack).toBe(true); // 60% > 80% of expected (~43%)
    expect(estimation.estimatedDaysToCompletion).toBe(2); // (100-60)/20 = 2 days
  });

  test('calculates monthly goal estimation correctly when behind', () => {
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z')); // Day 15 of month

    const estimation = calculateProgressEstimation(
      30, // current value
      100, // target value
      'monthly',
      '2024-01-01T00:00:00Z',
    );

    expect(estimation.currentProgress).toBe(30);
    expect(estimation.progressRate).toBe(2); // 30% / 15 days
    expect(estimation.isOnTrack).toBe(false); // 30% < 80% of expected (~48%)
    expect(estimation.estimatedDaysToCompletion).toBe(35); // (100-30)/2 = 35 days
  });

  test('handles completed goals correctly', () => {
    const estimation = calculateProgressEstimation(
      120, // current value (over target)
      100, // target value
      'weekly',
      '2024-01-15T00:00:00Z',
    );

    expect(estimation.currentProgress).toBe(100); // Capped at 100%
    expect(estimation.isOnTrack).toBe(true);
  });

  test('integrates calorie-based progress for weight goals', () => {
    const calorieBasedProgress = {
      calorieDeficit: 3500,
      weightChangeFromCalories: 0.5,
      adjustedProgress: 50,
    };

    const estimation = calculateProgressEstimation(
      25, // current value (basic progress)
      100, // target value
      'weekly',
      '2024-01-15T00:00:00Z',
      calorieBasedProgress,
    );

    expect(estimation.currentProgress).toBe(50); // Uses calorie-based progress
    expect(estimation.calorieBasedProgress).toEqual(calorieBasedProgress);
  });

  test('handles zero progress rate', () => {
    const estimation = calculateProgressEstimation(
      0, // no progress
      100, // target value
      'weekly',
      '2024-01-15T00:00:00Z',
    );

    expect(estimation.currentProgress).toBe(0);
    expect(estimation.progressRate).toBe(0);
    expect(estimation.estimatedDaysToCompletion).toBeNull();
    expect(estimation.estimatedCompletionDate).toBeNull();
  });

  test('handles goals where current equals target (already achieved)', () => {
    const estimation = calculateProgressEstimation(
      100, // current value equals target
      100, // target value
      'monthly',
      '2024-01-15T00:00:00Z',
    );

    expect(estimation.currentProgress).toBe(100);
    expect(estimation.isOnTrack).toBe(true);
  });
});

describe('formatEstimationText', () => {
  test('formats completed goal correctly', () => {
    const estimation: ProgressEstimation = {
      currentProgress: 100,
      estimatedDaysToCompletion: null,
      estimatedCompletionDate: null,
      progressRate: 10,
      isOnTrack: true,
    };

    expect(formatEstimationText(estimation, 'daily')).toBe('🎉 Goal achieved!');
    expect(formatEstimationText(estimation, 'weekly')).toBe('🎉 Goal achieved!');
    expect(formatEstimationText(estimation, 'monthly')).toBe('🎉 Goal achieved!');
  });

  test('formats daily goals correctly', () => {
    const onTrackEstimation: ProgressEstimation = {
      currentProgress: 75,
      estimatedDaysToCompletion: 1,
      estimatedCompletionDate: new Date(),
      progressRate: 75,
      isOnTrack: true,
    };

    const behindEstimation: ProgressEstimation = {
      currentProgress: 30,
      estimatedDaysToCompletion: 1,
      estimatedCompletionDate: new Date(),
      progressRate: 30,
      isOnTrack: false,
    };

    expect(formatEstimationText(onTrackEstimation, 'daily')).toBe('✅ On track for today');
    expect(formatEstimationText(behindEstimation, 'daily')).toBe('⚠️ Behind daily target');
  });

  test('formats weekly/monthly goals with completion estimation', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

    const estimation: ProgressEstimation = {
      currentProgress: 60,
      estimatedDaysToCompletion: 2,
      estimatedCompletionDate: new Date('2024-01-17T12:00:00Z'),
      progressRate: 20,
      isOnTrack: true,
    };

    expect(formatEstimationText(estimation, 'weekly')).toBe('📅 Est. 2 days to completion');
    expect(formatEstimationText(estimation, 'monthly')).toBe('📅 Est. 2 days to completion');

    jest.useRealTimers();
  });

  test('formats goals that may not complete in time', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

    const estimation: ProgressEstimation = {
      currentProgress: 30,
      estimatedDaysToCompletion: 10,
      estimatedCompletionDate: new Date('2024-01-25T12:00:00Z'), // After week ends
      progressRate: 5,
      isOnTrack: false,
    };

    expect(formatEstimationText(estimation, 'weekly')).toBe('⚠️ May not complete this weekly');
    expect(formatEstimationText(estimation, 'monthly')).toBe('📅 Est. 10 days to completion');

    jest.useRealTimers();
  });

  test('formats goals with progress rate only', () => {
    const estimation: ProgressEstimation = {
      currentProgress: 40,
      estimatedDaysToCompletion: null,
      estimatedCompletionDate: null,
      progressRate: 8.5,
      isOnTrack: true,
    };

    expect(formatEstimationText(estimation, 'weekly')).toBe('📈 8.5% progress/day');
  });

  test('formats goals with no progress', () => {
    const estimation: ProgressEstimation = {
      currentProgress: 0,
      estimatedDaysToCompletion: null,
      estimatedCompletionDate: null,
      progressRate: 0,
      isOnTrack: false,
    };

    expect(formatEstimationText(estimation, 'weekly')).toBe('📊 Tracking progress...');
  });
});

describe('Edge cases and error handling', () => {
  test('handles invalid dates gracefully', () => {
    expect(() => {
      calculateProgressEstimation(50, 100, 'weekly', 'invalid-date');
    }).not.toThrow();
  });

  test('handles negative values', () => {
    const estimation = calculateProgressEstimation(
      -10, // negative current value
      100,
      'weekly',
      '2024-01-15T00:00:00Z',
    );

    expect(estimation.currentProgress).toBe(0); // Should be clamped to 0
    expect(estimation.currentProgress).toBeLessThanOrEqual(100);
    expect(estimation.currentProgress).toBeGreaterThanOrEqual(0);
  });

  test('handles zero target value', () => {
    const estimation = calculateProgressEstimation(
      50,
      0, // zero target
      'weekly',
      '2024-01-15T00:00:00Z',
    );

    expect(estimation).toBeDefined();
    expect(estimation.currentProgress).toBeGreaterThanOrEqual(0);
  });
});
