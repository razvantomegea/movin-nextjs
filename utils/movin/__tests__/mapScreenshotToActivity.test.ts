import { mapScreenshotToActivity, ExtractedActivityData } from '../mapScreenshotToActivity';

describe('mapScreenshotToActivity', () => {
  const baseData: ExtractedActivityData = {
    name: 'Walking',
    duration: 1800,
    distance: 2000,
    calories: 100,
    steps: 2500,
    heartRate: { average: 100, maximum: 120, minimum: 80 },
    deviceTime: '10:00',
    activityTime: '09:30',
    activityDate: '2024-06-01',
    isValidScreenshot: true,
    isValidTiming: true,
  };
  const userAddress = 'erd1testaddress';

  it('maps all fields correctly', () => {
    const result = mapScreenshotToActivity(baseData, userAddress);
    expect(result.address).toBe(userAddress);
    expect(result.name).toBe('Walking');
    expect(result.total_distance).toBe(2000);
    expect(result.total_steps).toBe(2500);
    expect(result.total_energy_burned).toBe(100);
    expect(result.average_heart_rate).toBe(100);
  });

  it('estimates steps from distance if steps missing', () => {
    const data = { ...baseData, steps: undefined, distance: 2600 };
    const result = mapScreenshotToActivity(data, userAddress);
    expect(result.total_steps).toBe(Math.round((2600 / 1000) * 1300));
  });

  it('estimates distance from steps if distance missing', () => {
    const data = { ...baseData, steps: 3000, distance: undefined };
    const result = mapScreenshotToActivity(data, userAddress);
    expect(result.total_distance).toBe(Math.round(3000 * (1000 / 1300)));
  });
});
