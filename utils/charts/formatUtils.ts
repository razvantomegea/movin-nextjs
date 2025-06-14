/**
 * Formatting utility functions for charts
 */

/**
 * Format activity value based on metric type
 * @param value The value to format
 * @param metric The metric type ('steps', 'calories', 'distance', 'duration')
 * @returns Formatted value as a string
 */
export type ActivityMetric = 'steps' | 'calories' | 'distance' | 'duration';
export function formatActivityValue(value: number, metric: ActivityMetric): string {
  switch (metric) {
    case 'steps':
      return value.toLocaleString();
    case 'calories':
      return value.toLocaleString();
    case 'distance':
      return value.toFixed(1);
    case 'duration':
      return value.toString();
    default:
      return value.toString();
  }
}

/**
 * Format nutrition value based on metric type
 * @param value The value to format
 * @param metric The metric type ('calories', 'carbohydrates', 'fats', 'protein')
 * @returns Formatted value as a string
 */
export function formatNutritionValue(value: number, metric: string): string {
  switch (metric) {
    case 'calories':
      return value.toLocaleString();
    case 'carbohydrates':
    case 'fats':
    case 'protein':
      return value.toLocaleString();
    default:
      return value.toString();
  }
}

/**
 * Get unit for activity metric
 * @param metric The metric type ('steps', 'calories', 'distance', 'duration')
 * @returns Unit string for the metric
 */
export function getActivityUnit(metric: string): string {
  switch (metric) {
    case 'steps':
      return '';
    case 'calories':
      return 'kcal';
    case 'distance':
      return 'km';
    case 'duration':
      return 'min';
    default:
      return '';
  }
}

/**
 * Get unit for nutrition metric
 * @param metric The metric type ('calories', 'carbohydrates', 'fats', 'protein')
 * @returns Unit string for the metric
 */
export function getNutritionUnit(metric: string): string {
  switch (metric) {
    case 'calories':
      return 'kcal';
    case 'carbohydrates':
    case 'fats':
    case 'protein':
      return 'g';
    default:
      return '';
  }
}

/**
 * Get label for activity metric
 * @param metric The metric type ('steps', 'calories', 'distance', 'duration')
 * @returns Label string for the metric
 */
export function getActivityMetricLabel(metric: string): string {
  switch (metric) {
    case 'steps':
      return 'Steps';
    case 'calories':
      return 'Calories';
    case 'distance':
      return 'Distance (km)';
    case 'duration':
      return 'Duration (min)';
    default:
      return '';
  }
}

/**
 * Get label for nutrition metric
 * @param metric The metric type ('calories', 'carbohydrates', 'fats', 'protein')
 * @returns Label string for the metric
 */
export function getNutritionMetricLabel(metric: string): string {
  switch (metric) {
    case 'calories':
      return 'Calories (kcal)';
    case 'carbohydrates':
      return 'Carbs (g)';
    case 'fats':
      return 'Fats (g)';
    case 'protein':
      return 'Protein (g)';
    default:
      return '';
  }
}
