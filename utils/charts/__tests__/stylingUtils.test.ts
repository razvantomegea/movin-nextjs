import {
  getActivityChartColor,
  getNutritionChartColor,
  createChartGradient,
  chartAnimationVariants,
} from '../stylingUtils';

describe('stylingUtils', () => {
  describe('getActivityChartColor', () => {
    it('should return correct color for light theme', () => {
      expect(getActivityChartColor(false)).toBe('#2563eb');
    });

    it('should return correct color for dark theme', () => {
      expect(getActivityChartColor(true)).toBe('#3b82f6');
    });
  });

  describe('getNutritionChartColor', () => {
    describe('with light theme', () => {
      it('should return correct color for calories', () => {
        expect(getNutritionChartColor('calories', false)).toBe('#2563eb');
      });

      it('should return correct color for carbohydrates', () => {
        expect(getNutritionChartColor('carbohydrates', false)).toBe('#3b82f6');
      });

      it('should return correct color for fats', () => {
        expect(getNutritionChartColor('fats', false)).toBe('#eab308');
      });

      it('should return correct color for protein', () => {
        expect(getNutritionChartColor('protein', false)).toBe('#22c55e');
      });

      it('should return default color for unknown metrics', () => {
        expect(getNutritionChartColor('unknown', false)).toBe('#2563eb');
      });
    });

    describe('with dark theme', () => {
      it('should return correct color for calories', () => {
        expect(getNutritionChartColor('calories', true)).toBe('#3b82f6');
      });

      it('should return correct color for carbohydrates', () => {
        expect(getNutritionChartColor('carbohydrates', true)).toBe('#60a5fa');
      });

      it('should return correct color for fats', () => {
        expect(getNutritionChartColor('fats', true)).toBe('#facc15');
      });

      it('should return correct color for protein', () => {
        expect(getNutritionChartColor('protein', true)).toBe('#4ade80');
      });

      it('should return default color for unknown metrics', () => {
        expect(getNutritionChartColor('unknown', true)).toBe('#3b82f6');
      });
    });
  });

  describe('createChartGradient', () => {
    it('should create gradient config with custom color', () => {
      const gradient = createChartGradient('testId', false, '#ff0000');

      expect(gradient.id).toBe('testId');
      expect(gradient.stops).toHaveLength(2);
      expect(gradient.stops[0].color).toBe('#ff0000');
      expect(gradient.stops[0].opacity).toBe(0.8);
      expect(gradient.stops[1].color).toBe('#f9fafb');
      expect(gradient.stops[1].opacity).toBe(0.3);
    });

    describe('with light theme', () => {
      it('should create default gradient config', () => {
        const gradient = createChartGradient('testId', false);

        expect(gradient.id).toBe('testId');
        expect(gradient.stops).toHaveLength(2);
        expect(gradient.stops[0].color).toBe('#f3f4f6');
        expect(gradient.stops[0].opacity).toBe(0.8);
        expect(gradient.stops[1].color).toBe('#f9fafb');
        expect(gradient.stops[1].opacity).toBe(0.3);
      });
    });

    describe('with dark theme', () => {
      it('should create default gradient config', () => {
        const gradient = createChartGradient('testId', true);

        expect(gradient.id).toBe('testId');
        expect(gradient.stops).toHaveLength(2);
        expect(gradient.stops[0].color).toBe('#3b82f6');
        expect(gradient.stops[0].opacity).toBe(0.1);
        expect(gradient.stops[1].color).toBe('#3b82f6');
        expect(gradient.stops[1].opacity).toBe(0.02);
      });
    });
  });

  describe('chartAnimationVariants', () => {
    it('should have hidden state with correct properties', () => {
      expect(chartAnimationVariants.hidden).toEqual({ opacity: 0, y: 20 });
    });

    it('should have visible state with correct properties', () => {
      expect(chartAnimationVariants.visible).toMatchObject({
        opacity: 1,
        y: 0,
        transition: expect.objectContaining({
          duration: 0.5,
          ease: 'easeOut',
        }),
      });
    });

    it('should have exit state with correct properties', () => {
      expect(chartAnimationVariants.exit).toMatchObject({
        opacity: 0,
        y: -20,
        transition: expect.objectContaining({
          duration: 0.3,
          ease: 'easeIn',
        }),
      });
    });
  });
});
