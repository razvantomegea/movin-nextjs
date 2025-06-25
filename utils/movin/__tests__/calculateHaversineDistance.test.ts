import { calculateHaversineDistance } from '../calculateHaversineDistance';

describe('calculateHaversineDistance', () => {
  it('returns 0 for the same point', () => {
    expect(calculateHaversineDistance(0, 0, 0, 0)).toBeCloseTo(0, 5);
  });

  it('returns correct distance for 1 degree longitude at equator', () => {
    // 1 degree longitude at equator ~ 111.195 km
    const dist = calculateHaversineDistance(0, 0, 0, 1);
    expect(dist / 1000).toBeCloseTo(111.195, 3);
  });

  it('returns correct distance for 1 degree latitude', () => {
    // 1 degree latitude ~ 111.195 km
    const dist = calculateHaversineDistance(0, 0, 1, 0);
    expect(dist / 1000).toBeCloseTo(111.195, 3);
  });

  it('is symmetric', () => {
    const d1 = calculateHaversineDistance(10, 20, 30, 40);
    const d2 = calculateHaversineDistance(30, 40, 10, 20);
    expect(d1).toBeCloseTo(d2, 5);
  });
});
