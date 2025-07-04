import React from 'react';
import { NutritionTotalsProps } from './types';

export function NutritionTotals({ detectedMeal, isDark }: NutritionTotalsProps) {
  return (
    <div
      className={`p-4 rounded-lg ${
        isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'
      }`}
    >
      <h4 className="font-medium mb-3 text-blue-600 dark:text-blue-400">Nutrition Totals</h4>
      <div className="grid grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{Math.round(detectedMeal.calories)}</div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Calories</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{Math.round(detectedMeal.carbohydrates)}</div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Carbs (g)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{Math.round(detectedMeal.fats)}</div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fats (g)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{Math.round(detectedMeal.protein)}</div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Protein (g)</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{Math.round(detectedMeal.fiber)}</div>
          <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fiber (g)</div>
        </div>
      </div>
    </div>
  );
}
