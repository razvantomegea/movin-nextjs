/**
 * Styling utility functions for charts
 */

import { NutritionMetric } from './formatUtils';

/**
 * Get chart color for activity metric based on theme
 * @param metric The metric type
 * @param isDark Whether the theme is dark
 * @returns Color string for the chart
 */
export function getActivityChartColor(isDark: boolean): string {
  return isDark ? '#3b82f6' : '#2563eb';
}

/**
 * Get chart color for nutrition metric based on theme
 * @param metric The metric type ('calories', 'carbohydrates', 'fats', 'protein')
 * @param isDark Whether the theme is dark
 * @returns Color string for the chart
 */
export function getNutritionChartColor(metric: NutritionMetric, isDark: boolean): string {
  switch (metric) {
    case 'calories':
      return isDark ? '#3b82f6' : '#2563eb'; // blue
    case 'carbohydrates':
      return isDark ? '#60a5fa' : '#3b82f6'; // lighter blue
    case 'fats':
      return isDark ? '#facc15' : '#eab308'; // yellow
    case 'protein':
      return isDark ? '#4ade80' : '#22c55e'; // green
    default:
      return isDark ? '#3b82f6' : '#2563eb';
  }
}

/**
 * Get chart configuration for the background gradient
 * @param id Unique ID for the gradient
 * @param isDark Whether the theme is dark
 * @param color Base color for the gradient
 * @returns SVG gradient definitions
 */
export function createChartGradient(id: string, isDark: boolean, color?: string) {
  const baseColor = color || (isDark ? '#3b82f6' : '#f3f4f6');

  return {
    id,
    stops: [
      {
        offset: '0%',
        color: baseColor,
        opacity: isDark ? 0.1 : 0.8,
      },
      {
        offset: '100%',
        color: isDark ? baseColor : '#f9fafb',
        opacity: isDark ? 0.02 : 0.3,
      },
    ],
  };
}

/**
 * Animation variants for chart transitions (for Framer Motion)
 */
export const chartAnimationVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
};
