import { IActivity } from '@/lib/supabase/activities';
import {
  mapActivitiesToDaily,
  mapActivitiesToWeekly,
  mapActivitiesToMonthly,
  mapActivitiesToYearly,
  mapActivitiesToTodaysWorkouts,
  doesActivityOverlap,
} from '../activityMappers';

const mockActivities: IActivity[] = [
  {
    id: '1',
    name: 'Run',
    start_date: '2024-06-01T08:00:00Z',
    end_date: '2024-06-01T09:00:00Z',
    duration: 3600,
    total_distance: 5000,
    total_energy_burned: 300,
    total_steps: 6500,
    address: 'erd1testaddress',
    created_at: '2024-06-01T08:00:00Z',
    updated_at: '2024-06-01T08:00:00Z',
  },
  {
    id: '2',
    name: 'Walk',
    start_date: '2024-06-01T18:00:00Z',
    end_date: '2024-06-01T18:30:00Z',
    duration: 1800,
    total_distance: 2000,
    total_energy_burned: 100,
    total_steps: 2500,
    address: 'erd1testaddress',
    created_at: '2024-06-01T18:00:00Z',
    updated_at: '2024-06-01T18:00:00Z',
  },
  {
    id: '3',
    name: 'Cycle',
    start_date: '2024-06-02T07:00:00Z',
    end_date: '2024-06-02T08:00:00Z',
    duration: 3600,
    total_distance: 20000,
    total_energy_burned: 600,
    total_steps: 0,
    address: 'erd1testaddress',
    created_at: '2024-06-02T07:00:00Z',
    updated_at: '2024-06-02T07:00:00Z',
  },
];

describe('activityMappers', () => {
  it('mapActivitiesToDaily aggregates activities for a day', () => {
    const result = mapActivitiesToDaily(mockActivities, new Date('2024-06-01'));
    expect(result.steps).toBe(9000);
    expect(result.distance).toBeCloseTo(7);
    expect(result.calories).toBe(400);
    expect(result.activeMinutes).toBeCloseTo(90);
  });

  it('mapActivitiesToWeekly returns 7 entries', () => {
    const result = mapActivitiesToWeekly(mockActivities, new Date('2024-06-02'));
    expect(result.length).toBe(7);
    expect(result.some((d) => d.steps > 0)).toBe(true);
  });

  it('mapActivitiesToMonthly returns correct days', () => {
    const result = mapActivitiesToMonthly(mockActivities, new Date('2024-06-01'));
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].steps).toBe(9000);
    expect(result[1].steps).toBe(0);
  });

  it('mapActivitiesToYearly returns 12 months', () => {
    const result = mapActivitiesToYearly(mockActivities, new Date('2024-06-01'));
    expect(result.length).toBe(12);
    expect(result.some((m) => m.steps > 0)).toBe(true);
  });

  it('mapActivitiesToTodaysWorkouts formats workouts for a day', () => {
    const result = mapActivitiesToTodaysWorkouts(mockActivities, new Date('2024-06-01'));
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('type');
    expect(result[0]).toHaveProperty('duration');
    expect(result[0]).toHaveProperty('distance');
  });
});

describe('doesActivityOverlap', () => {
  const baseActivities = [
    {
      id: '1',
      start_date: '2024-06-01T08:00:00Z',
      end_date: '2024-06-01T09:00:00Z',
    },
    {
      id: '2',
      start_date: '2024-06-01T10:00:00Z',
      end_date: '2024-06-01T11:00:00Z',
    },
  ];

  it('returns null if no overlap', () => {
    const newAct = { start_date: '2024-06-01T09:00:00Z', end_date: '2024-06-01T10:00:00Z' };
    expect(doesActivityOverlap(newAct, baseActivities)).toBeNull();
  });

  it('detects exact overlap', () => {
    const newAct = { start_date: '2024-06-01T08:00:00Z', end_date: '2024-06-01T09:00:00Z' };
    expect(doesActivityOverlap(newAct, baseActivities)).toEqual(baseActivities[0]);
  });

  it('detects partial overlap at start', () => {
    const newAct = { start_date: '2024-06-01T08:30:00Z', end_date: '2024-06-01T09:30:00Z' };
    expect(doesActivityOverlap(newAct, baseActivities)).toEqual(baseActivities[0]);
  });

  it('detects partial overlap at end', () => {
    const newAct = { start_date: '2024-06-01T09:30:00Z', end_date: '2024-06-01T10:30:00Z' };
    expect(doesActivityOverlap(newAct, baseActivities)).toEqual(baseActivities[1]);
  });

  it('detects new inside existing', () => {
    const newAct = { start_date: '2024-06-01T08:15:00Z', end_date: '2024-06-01T08:45:00Z' };
    expect(doesActivityOverlap(newAct, baseActivities)).toEqual(baseActivities[0]);
  });

  it('detects existing inside new', () => {
    const newAct = { start_date: '2024-06-01T07:00:00Z', end_date: '2024-06-01T12:00:00Z' };
    expect(doesActivityOverlap(newAct, baseActivities)).toEqual(baseActivities[0]);
  });

  it('ignores self when editing', () => {
    const newAct = {
      id: '1',
      start_date: '2024-06-01T08:00:00Z',
      end_date: '2024-06-01T09:00:00Z',
    };
    expect(doesActivityOverlap(newAct, baseActivities)).toBeNull();
  });
});
