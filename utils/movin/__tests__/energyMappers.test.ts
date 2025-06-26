import { IEnergy } from '@/lib/supabase/energy';
import {
  mapEnergyToDaily,
  mapEnergyToWeekly,
  mapEnergyToMonthly,
  mapEnergyToYearly,
  mapEnergyToTodaysMeals,
} from '../energyMappers';

const mockEnergy: IEnergy[] = [
  {
    id: '1',
    meal_name: 'Breakfast',
    log_date: '2024-06-01T08:00:00Z',
    created_at: '2024-06-01T08:00:00Z',
    calories: 400,
    protein: 20,
    carbohydrates: 50,
    fats: 10,
    fiber: 5,
    address: 'erd1testaddress',
    updated_at: '2024-06-01T08:00:00Z',
  },
  {
    id: '2',
    meal_name: 'Lunch',
    log_date: '2024-06-01T13:00:00Z',
    created_at: '2024-06-01T13:00:00Z',
    calories: 600,
    protein: 30,
    carbohydrates: 70,
    fats: 20,
    fiber: 8,
    address: 'erd1testaddress',
    updated_at: '2024-06-01T13:00:00Z',
  },
  {
    id: '3',
    meal_name: 'Dinner',
    log_date: '2024-06-02T19:00:00Z',
    created_at: '2024-06-02T19:00:00Z',
    calories: 700,
    protein: 35,
    carbohydrates: 80,
    fats: 25,
    fiber: 10,
    address: 'erd1testaddress',
    updated_at: '2024-06-02T19:00:00Z',
  },
];

describe('energyMappers', () => {
  it('mapEnergyToDaily aggregates nutrition for a day', () => {
    const result = mapEnergyToDaily(mockEnergy, new Date('2024-06-01'));
    expect(result.calories).toBe(1000);
    expect(result.protein).toBe(50);
    expect(result.carbohydrates).toBe(120);
    expect(result.fats).toBe(30);
    expect(result.fiber).toBe(13);
    expect(result.mealsCount).toBe(2);
  });

  it('mapEnergyToWeekly returns 7 entries', () => {
    const result = mapEnergyToWeekly(mockEnergy, new Date('2024-06-02'));
    expect(result.length).toBe(7);
    expect(result.some((d) => d.calories > 0)).toBe(true);
  });

  it('mapEnergyToMonthly returns correct days', () => {
    const result = mapEnergyToMonthly(mockEnergy, new Date('2024-06-01'));
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result[0].calories).toBe(1000);
    expect(result[1].calories).toBe(700);
  });

  it('mapEnergyToYearly returns 12 months', () => {
    const result = mapEnergyToYearly(mockEnergy, new Date('2024-06-01'));
    expect(result.length).toBe(12);
    expect(result.some((m) => m.calories > 0)).toBe(true);
  });

  it('mapEnergyToTodaysMeals formats meals for a day', () => {
    const result = mapEnergyToTodaysMeals(mockEnergy, new Date('2024-06-01'));
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty('name');
    expect(result[0]).toHaveProperty('calories');
    expect(result[0]).toHaveProperty('time');
  });
});
