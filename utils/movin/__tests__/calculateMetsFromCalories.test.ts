import { calculateMetsFromCalories } from '../calculateMets';

describe('calculateMetsFromCalories', () => {
  it('calculates METs for typical calorie values', () => {
    expect(calculateMetsFromCalories(70)).toBe(2);
    expect(calculateMetsFromCalories(350)).toBe(10);
    expect(calculateMetsFromCalories(0)).toBe(0);
  });

  it('handles negative calories', () => {
    expect(calculateMetsFromCalories(-35)).toBe(-1);
  });
});
