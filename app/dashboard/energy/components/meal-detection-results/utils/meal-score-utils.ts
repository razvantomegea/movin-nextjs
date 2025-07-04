import { MealScoreInfo } from '../types';

/**
 * Get meal score color, background, label, and icon based on score
 */
export function getMealScoreInfo(score: number): MealScoreInfo {
  if (score >= 90) {
    return {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
      label: 'Exceptional',
      icon: '🌟',
    };
  }
  if (score >= 80) {
    return {
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
      label: 'Very Good',
      icon: '✨',
    };
  }
  if (score >= 70) {
    return {
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
      label: 'Good',
      icon: '👍',
    };
  }
  if (score >= 60) {
    return {
      color: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-500/10',
      label: 'Fair',
      icon: '⚡',
    };
  }
  if (score >= 50) {
    return {
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500/10',
      label: 'Average',
      icon: '📊',
    };
  }
  if (score >= 40) {
    return {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
      label: 'Below Average',
      icon: '⚠️',
    };
  }
  if (score >= 30) {
    return {
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
      label: 'Poor',
      icon: '❌',
    };
  }
  return {
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-600/20',
    label: 'Very Poor',
    icon: '🚫',
  };
}

/**
 * Get progress bar color based on meal score
 */
export function getProgressBarColor(score: number): string {
  if (score >= 70) return 'bg-green-500';
  if (score >= 50) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Calculate reward amount based on meal score
 */
export function calculateRewardAmount(score: number): string {
  return (score / 100).toFixed(2);
}

/**
 * Calculate photo validation reward amount
 */
export function calculatePhotoValidationReward(
  baseScore: number,
  isValid: boolean,
  confidence: number,
): string {
  const baseReward = baseScore / 100;
  const validationBonus = isValid && confidence >= 70 ? 0.5 : 0;
  return (baseReward + validationBonus).toFixed(2);
}

/**
 * Check if user can claim reward based on last claim timestamp
 */
export function canClaimReward(lastClaimTimestamp: number | null, rewardAmount: string): boolean {
  if (Number(rewardAmount) <= 0) return false;
  if (!lastClaimTimestamp) return true;

  const now = Math.floor(Date.now() / 1000);
  return now - lastClaimTimestamp >= 7200; // 2 hour cooldown
}

/**
 * Calculate seconds to wait before next reward claim
 */
export function getSecondsToWait(lastClaimTimestamp: number | null): number {
  if (!lastClaimTimestamp) return 0;

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, 7200 - (now - lastClaimTimestamp));
}
