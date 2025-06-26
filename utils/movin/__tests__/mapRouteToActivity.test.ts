import { mapRouteToActivity } from '../mapRouteToActivity';

describe('mapRouteToActivity', () => {
  it('maps route data to activity with correct fields', () => {
    const routeData = {
      distance: 5000, // meters
      duration: 1800, // seconds
      isJoint: false,
    };
    const userAddress = 'erd1testaddress';
    const result = mapRouteToActivity(routeData, userAddress);
    expect(result.address).toBe(userAddress);
    expect(result.name).toBe('Manual Exercise');
    expect(result.total_distance).toBe(5000);
    expect(result.duration).toBe(1800);
    expect(result.total_steps).toBe(Math.round((5000 / 1000) * 1300));
    expect(result.total_energy_burned).toBeGreaterThan(0);
    expect(result.maximum_heart_rate).toBe(0);
  });

  it('sets name to Joint Exercise if isJoint is true', () => {
    const routeData = {
      distance: 1000,
      duration: 600,
      isJoint: true,
    };
    const userAddress = 'erd1testaddress';
    const result = mapRouteToActivity(routeData, userAddress);
    expect(result.name).toBe('Joint Exercise');
  });
});
