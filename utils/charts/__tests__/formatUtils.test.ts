import {
  formatActivityValue,
  formatNutritionValue,
  getActivityUnit,
  getNutritionUnit,
  getActivityMetricLabel,
  getNutritionMetricLabel,
  ActivityMetric,
  NutritionMetric,
} from '../formatUtils';

describe('formatUtils', () => {
  describe('formatActivityValue', () => {
    it('should format steps correctly', () => {
      expect(formatActivityValue(1000, 'steps')).toBe('1,000');
      expect(formatActivityValue(1000000, 'steps')).toBe('1,000,000');
    });

    it('should format calories correctly', () => {
      expect(formatActivityValue(1000, 'calories')).toBe('1,000');
      expect(formatActivityValue(1500, 'calories')).toBe('1,500');
    });

    it('should format distance correctly', () => {
      expect(formatActivityValue(10.5, 'distance')).toBe('10.5');
      expect(formatActivityValue(10.54321, 'distance')).toBe('10.5');
    });

    it('should format duration correctly', () => {
      expect(formatActivityValue(60, 'duration')).toBe('60');
      expect(formatActivityValue(90, 'duration')).toBe('90');
    });

    it('should handle unknown metric types', () => {
      expect(formatActivityValue(1000, 'unknown' as ActivityMetric)).toBe('1000');
    });
  });

  describe('formatNutritionValue', () => {
    it('should format calories correctly', () => {
      expect(formatNutritionValue(1000, 'calories')).toBe('1,000');
      expect(formatNutritionValue(1500, 'calories')).toBe('1,500');
    });

    it('should format carbohydrates correctly', () => {
      expect(formatNutritionValue(100, 'carbohydrates')).toBe('100');
      expect(formatNutritionValue(1000, 'carbohydrates')).toBe('1,000');
    });

    it('should format fats correctly', () => {
      expect(formatNutritionValue(50, 'fats')).toBe('50');
      expect(formatNutritionValue(1000, 'fats')).toBe('1,000');
    });

    it('should format protein correctly', () => {
      expect(formatNutritionValue(75, 'protein')).toBe('75');
      expect(formatNutritionValue(1000, 'protein')).toBe('1,000');
    });

    it('should format fiber correctly', () => {
      expect(formatNutritionValue(10, 'fiber')).toBe('10');
      expect(formatNutritionValue(1000, 'fiber')).toBe('1,000');
    });

    it('should handle unknown metric types', () => {
      expect(formatNutritionValue(1000, 'unknown' as NutritionMetric)).toBe('1000');
    });
  });

  describe('getActivityUnit', () => {
    it('should return correct units for steps', () => {
      expect(getActivityUnit('steps')).toBe('');
    });

    it('should return correct units for calories', () => {
      expect(getActivityUnit('calories')).toBe('kcal');
    });

    it('should return correct units for distance', () => {
      expect(getActivityUnit('distance')).toBe('km');
    });

    it('should return correct units for duration', () => {
      expect(getActivityUnit('duration')).toBe('min');
    });

    it('should return empty string for unknown metrics', () => {
      expect(getActivityUnit('unknown' as ActivityMetric)).toBe('');
    });
  });

  describe('getNutritionUnit', () => {
    it('should return correct units for calories', () => {
      expect(getNutritionUnit('calories')).toBe('kcal');
    });

    it('should return correct units for carbohydrates', () => {
      expect(getNutritionUnit('carbohydrates')).toBe('g');
    });

    it('should return correct units for fats', () => {
      expect(getNutritionUnit('fats')).toBe('g');
    });

    it('should return correct units for protein', () => {
      expect(getNutritionUnit('protein')).toBe('g');
    });

    it('should return correct units for fiber', () => {
      expect(getNutritionUnit('fiber')).toBe('g');
    });

    it('should return empty string for unknown metrics', () => {
      expect(getNutritionUnit('unknown' as NutritionMetric)).toBe('');
    });
  });

  describe('getActivityMetricLabel', () => {
    it('should return correct label for steps', () => {
      expect(getActivityMetricLabel('steps')).toBe('Steps');
    });

    it('should return correct label for calories', () => {
      expect(getActivityMetricLabel('calories')).toBe('Calories');
    });

    it('should return correct label for distance', () => {
      expect(getActivityMetricLabel('distance')).toBe('Distance (km)');
    });

    it('should return correct label for duration', () => {
      expect(getActivityMetricLabel('duration')).toBe('Duration (min)');
    });

    it('should return empty string for unknown metrics', () => {
      expect(getActivityMetricLabel('unknown' as ActivityMetric)).toBe('');
    });
  });

  describe('getNutritionMetricLabel', () => {
    it('should return correct label for calories', () => {
      expect(getNutritionMetricLabel('calories')).toBe('Calories (kcal)');
    });

    it('should return correct label for carbohydrates', () => {
      expect(getNutritionMetricLabel('carbohydrates')).toBe('Carbs (g)');
    });

    it('should return correct label for fats', () => {
      expect(getNutritionMetricLabel('fats')).toBe('Fats (g)');
    });

    it('should return correct label for protein', () => {
      expect(getNutritionMetricLabel('protein')).toBe('Protein (g)');
    });

    it('should return correct label for fiber', () => {
      expect(getNutritionMetricLabel('fiber')).toBe('Fiber (g)');
    });

    it('should return empty string for unknown metrics', () => {
      expect(getNutritionMetricLabel('unknown' as NutritionMetric)).toBe('');
    });
  });
});
