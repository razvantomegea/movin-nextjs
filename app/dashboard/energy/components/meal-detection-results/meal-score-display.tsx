import React from 'react';
import { Award, Info } from 'lucide-react';
import { ResponsiveTooltip } from '@/components/ui/responsive-tooltip';
import { TooltipProvider } from '@/components/ui/tooltip';
import { MealScoreDisplayProps } from './types';
import { getMealScoreInfo, getProgressBarColor } from './utils/meal-score-utils';

export function MealScoreDisplay({
  mealScore,
  isDark,
  isEditingDisabled,
  sourceType,
  canClaimReward,
  rewardAmount,
  isLastClaimLoading,
  secondsToWait,
}: MealScoreDisplayProps) {
  if (mealScore === undefined) {
    return null;
  }

  const scoreInfo = getMealScoreInfo(mealScore);
  const progressBarColor = getProgressBarColor(mealScore);

  return (
    <div
      className={`p-4 rounded-lg border ${scoreInfo.bg} ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <TooltipProvider>
          <div className="flex items-center space-x-2">
            <Award className={`h-5 w-5 ${scoreInfo.color}`} />
            <span className="font-medium">Nutrition Score</span>
            <ResponsiveTooltip
              content={
                <div className="w-80 p-3 rounded-lg bg-gray-900 text-white text-sm shadow-lg">
                  <div className="font-semibold mb-2">Nutrition Score (0-100)</div>
                  <div className="space-y-2">
                    <p>
                      This score represents the overall nutritional quality of your meal based on:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Nutrient density and balance</li>
                      <li>Protein quality and quantity</li>
                      <li>Fiber and micronutrient content</li>
                      <li>Processing level of ingredients</li>
                    </ul>
                    <div className="pt-2 border-t border-gray-700">
                      <p className="font-medium text-green-400 mb-1">To improve your score:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Add more vegetables and fruits</li>
                        <li>Choose lean proteins and whole grains</li>
                        <li>Reduce processed foods and added sugars</li>
                        <li>Include healthy fats (nuts, olive oil, avocado)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              }
              side="bottom"
              className="w-80 p-3 rounded-lg bg-gray-900 text-white text-sm shadow-lg"
            >
              <button
                type="button"
                className={`${
                  isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                } focus:outline-none`}
                aria-label="Meal score information"
              >
                <Info className="inline h-4 w-4" />
              </button>
            </ResponsiveTooltip>
            {isEditingDisabled && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}
              >
                AI Analysis
              </span>
            )}
          </div>
        </TooltipProvider>
        <div className="flex items-center space-x-2">
          <span className={`text-2xl font-bold ${scoreInfo.color}`}>{mealScore}</span>
          <span className="text-2xl">{scoreInfo.icon}</span>
        </div>
      </div>

      <div className="mt-2">
        <div className={`text-sm font-medium ${scoreInfo.color}`}>{scoreInfo.label}</div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${progressBarColor}`}
            style={{ width: `${mealScore}%` }}
          />
        </div>

        {/* MVN reward message for camera-based meals */}
        {sourceType === 'camera' && (
          <div className="mt-3 flex items-center text-sm">
            {isLastClaimLoading ? (
              <span>Checking reward eligibility...</span>
            ) : canClaimReward ? (
              <>
                <span>
                  You will receive <span className="font-semibold">{rewardAmount} MVN</span>
                </span>
                <div className="ml-2 relative group">
                  <button
                    type="button"
                    className="text-blue-500 hover:text-blue-700 focus:outline-none"
                    aria-label="Info"
                  >
                    <Info className="inline h-4 w-4" />
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 p-2 rounded bg-gray-800 text-white text-xs shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                    After saving this meal and confirming the transaction, you will receive{' '}
                    {rewardAmount} MVN in your wallet.
                  </div>
                </div>
              </>
            ) : secondsToWait > 0 ? (
              <span className="text-orange-500">
                You must wait {Math.ceil(secondsToWait / 60)} minute(s) before claiming another meal
                reward. You can still save the meal.
              </span>
            ) : (
              <span className="text-orange-500">
                You are not eligible for a meal reward at this time (e.g., score too low), but you
                can still save the meal.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
