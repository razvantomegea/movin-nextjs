import { IActivity } from '@/lib/supabase/activities';
import { IBadge, IUserBadge, BadgeProgressData, BadgeMetadata } from '@/lib/supabase/badges';
import { IProfile } from '@/lib/supabase/profile';

export interface BadgeCheckContext {
  activities: IActivity[];
  profile: IProfile;
  userBadges: IUserBadge[];
  newActivity?: IActivity; // For single activity checks
  isPremium?: boolean;
  hasStakes?: boolean;
}

export interface BadgeProgress {
  current: number;
  required: number;
  percentage: number;
}

export interface BadgeCheckResult {
  badgeId: string;
  earned: boolean;
  progress?: BadgeProgress;
  progressData?: BadgeProgressData;
  metadata?: BadgeMetadata;
}

/**
 * Calculate total distance from all activities
 */
export function calculateTotalDistance(activities: IActivity[]): number {
  return activities.reduce((total, activity) => total + (activity.total_distance || 0), 0);
}

/**
 * Calculate total steps from all activities
 */
export function calculateTotalSteps(activities: IActivity[]): number {
  return activities.reduce((total, activity) => total + (activity.total_steps || 0), 0);
}

/**
 * Get steps for a specific day
 */
export function getStepsForDay(activities: IActivity[], date: Date): number {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  return activities
    .filter((activity) => {
      const activityDate = new Date(activity.start_date);
      return activityDate >= targetDate && activityDate < nextDay;
    })
    .reduce((total, activity) => total + (activity.total_steps || 0), 0);
}

/**
 * Count joint activities
 */
export function countJointActivities(activities: IActivity[]): number {
  return activities.filter(
    (activity) =>
      activity.name?.toLowerCase().includes('joint') || activity.source === 'Joint Tracking',
  ).length;
}

/**
 * Check if activity was done early (before 7 AM)
 */
export function isEarlyMorningActivity(activity: IActivity): boolean {
  const activityTime = new Date(activity.start_date);
  return activityTime.getHours() < 7;
}

/**
 * Check if activity was done late (after 9 PM)
 */
export function isLateNightActivity(activity: IActivity): boolean {
  const activityTime = new Date(activity.start_date);
  return activityTime.getHours() >= 21;
}

/**
 * Check if profile is complete
 */
export function isProfileComplete(profile: IProfile): boolean {
  return !!(
    profile.username &&
    profile.email &&
    profile.avatar_url &&
    profile.username.trim() !== '' &&
    profile.email.trim() !== ''
  );
}

/**
 * Check distance-based badges
 */
export function checkDistanceBadges(badge: IBadge, context: BadgeCheckContext): BadgeCheckResult {
  const result: BadgeCheckResult = {
    badgeId: badge.id,
    earned: false,
  };

  if (badge.requirement_type === 'total') {
    const totalDistance = calculateTotalDistance(context.activities);
    const required = badge.requirement_value || 0;

    result.earned = totalDistance >= required;
    result.progress = {
      current: totalDistance,
      required,
      percentage: required ? Math.min((totalDistance / required) * 100, 100) : 0,
    };
    result.metadata = {
      source: 'activity',
      calculationMethod: 'total_distance',
      achievementDate: new Date().toISOString(),
      version: '1.0',
    };
  } else if (badge.requirement_type === 'single_activity' && context.newActivity) {
    const activityDistance = context.newActivity.total_distance || 0;
    const required = badge.requirement_value || 0;

    result.earned = activityDistance >= required;
    result.progress = {
      current: activityDistance,
      required,
      percentage: Math.min((activityDistance / required) * 100, 100),
    };
    result.metadata = {
      source: 'activity',
      activityId: context.newActivity.id,
      activityType: context.newActivity.name || 'unknown',
      calculationMethod: 'single_activity_distance',
      achievementDate: new Date().toISOString(),
      version: '1.0',
    };
  }

  return result;
}

/**
 * Check step-based badges
 */
export function checkStepBadges(badge: IBadge, context: BadgeCheckContext): BadgeCheckResult {
  const result: BadgeCheckResult = {
    badgeId: badge.id,
    earned: false,
  };

  if (badge.requirement_type === 'single_activity') {
    if (context.newActivity) {
      // Check steps in the new activity
      const activitySteps = context.newActivity.total_steps || 0;
      const required = badge.requirement_value || 0;

      result.earned = activitySteps >= required;
      result.progress = {
        current: activitySteps,
        required,
        percentage: Math.min((activitySteps / required) * 100, 100),
      };
      result.metadata = {
        source: 'activity',
        activityId: context.newActivity.id,
        activityType: context.newActivity.name || 'unknown',
        calculationMethod: 'single_activity_steps',
        achievementDate: new Date().toISOString(),
        version: '1.0',
      };
    } else {
      // Check max steps in a single day
      const today = new Date();
      const todaySteps = getStepsForDay(context.activities, today);
      const required = badge.requirement_value || 0;

      result.earned = todaySteps >= required;
      result.progress = {
        current: todaySteps,
        required,
        percentage: Math.min((todaySteps / required) * 100, 100),
      };
      result.metadata = {
        source: 'activity',
        calculationMethod: 'daily_steps',
        achievementDate: new Date().toISOString(),
        version: '1.0',
      };
    }
  }

  return result;
}

/**
 * Check streak-based badges
 */
export function checkStreakBadges(badge: IBadge, context: BadgeCheckContext): BadgeCheckResult {
  const currentStreak = context.profile.streak_days;
  const required = badge.requirement_value || 0;

  return {
    badgeId: badge.id,
    earned: currentStreak >= required,
    progress: {
      current: currentStreak,
      required,
      percentage: Math.min((currentStreak / required) * 100, 100),
    },
    metadata: {
      source: 'profile',
      calculationMethod: 'activity_streak',
      achievementDate: new Date().toISOString(),
      version: '1.0',
      customData: {
        streakStartDate: context.profile.last_streak_update || context.profile.created_at,
      },
    },
  };
}

/**
 * Check time-based badges
 */
export function checkTimeBadges(badge: IBadge, context: BadgeCheckContext): BadgeCheckResult {
  const result: BadgeCheckResult = {
    badgeId: badge.id,
    earned: false,
  };

  switch (badge.name) {
    case 'Early Bird':
      if (context.newActivity) {
        result.earned = isEarlyMorningActivity(context.newActivity);
        result.metadata = {
          source: 'activity',
          activityId: context.newActivity.id,
          activityType: context.newActivity.name || 'unknown',
          calculationMethod: 'early_morning_check',
          achievementDate: new Date().toISOString(),
          version: '1.0',
          customData: {
            activityStartTime: context.newActivity.start_date,
          },
        };
      } else {
        result.earned = context.activities.some(isEarlyMorningActivity);
        result.metadata = {
          source: 'activity',
          calculationMethod: 'early_morning_check_all',
          achievementDate: new Date().toISOString(),
          version: '1.0',
        };
      }
      break;

    case 'Night Owl':
      if (context.newActivity) {
        result.earned = isLateNightActivity(context.newActivity);
        result.metadata = {
          source: 'activity',
          activityId: context.newActivity.id,
          activityType: context.newActivity.name || 'unknown',
          calculationMethod: 'late_night_check',
          achievementDate: new Date().toISOString(),
          version: '1.0',
          customData: {
            activityStartTime: context.newActivity.start_date,
          },
        };
      } else {
        result.earned = context.activities.some(isLateNightActivity);
        result.metadata = {
          source: 'activity',
          calculationMethod: 'late_night_check_all',
          achievementDate: new Date().toISOString(),
          version: '1.0',
        };
      }
      break;

    case 'Speed Demon':
    case 'Endurance Hero':
      if (badge.requirement_type === 'single_activity' && context.newActivity) {
        const duration = context.newActivity.duration || 0;
        const required = badge.requirement_value || 0;

        result.earned = duration >= required;
        result.progress = {
          current: duration,
          required,
          percentage: Math.min((duration / required) * 100, 100),
        };
        result.metadata = {
          source: 'activity',
          activityId: context.newActivity.id,
          activityType: context.newActivity.name || 'unknown',
          calculationMethod: 'duration_check',
          achievementDate: new Date().toISOString(),
          version: '1.0',
          customData: {
            durationSeconds: duration,
          },
        };
      }
      break;
  }

  return result;
}

/**
 * Check calorie-based badges
 */
export function checkCalorieBadges(badge: IBadge, context: BadgeCheckContext): BadgeCheckResult {
  const result: BadgeCheckResult = {
    badgeId: badge.id,
    earned: false,
  };

  if (badge.requirement_type === 'single_activity' && context.newActivity) {
    const calories = context.newActivity.total_energy_burned || 0;
    const required = badge.requirement_value || 0;

    result.earned = calories >= required;
    result.progress = {
      current: calories,
      required,
      percentage: Math.min((calories / required) * 100, 100),
    };
    result.metadata = {
      source: 'activity',
      activityId: context.newActivity.id,
      activityType: context.newActivity.name || 'unknown',
      calculationMethod: 'calories_burned',
      achievementDate: new Date().toISOString(),
      version: '1.0',
    };
  }

  return result;
}

/**
 * Check social badges
 */
export function checkSocialBadges(badge: IBadge, context: BadgeCheckContext): BadgeCheckResult {
  const result: BadgeCheckResult = {
    badgeId: badge.id,
    earned: false,
  };

  const jointActivitiesCount = countJointActivities(context.activities);

  switch (badge.name) {
    case 'Team Player':
      result.earned = jointActivitiesCount >= 1;
      result.metadata = {
        source: 'social',
        calculationMethod: 'joint_activities_count',
        achievementDate: new Date().toISOString(),
        version: '1.0',
        customData: {
          jointActivitiesCount,
        },
      };
      break;

    case 'Social Butterfly': {
      const required = badge.requirement_value || 10;
      result.earned = jointActivitiesCount >= required;
      result.progress = {
        current: jointActivitiesCount,
        required,
        percentage: Math.min((jointActivitiesCount / required) * 100, 100),
      };
      result.metadata = {
        source: 'social',
        calculationMethod: 'joint_activities_count',
        achievementDate: new Date().toISOString(),
        version: '1.0',
        customData: {
          jointActivitiesCount,
        },
      };
      break;
    }
  }

  return result;
}

/**
 * Check special condition badges
 */
export function checkSpecialBadges(badge: IBadge, context: BadgeCheckContext): BadgeCheckResult {
  const result: BadgeCheckResult = {
    badgeId: badge.id,
    earned: false,
  };

  switch (badge.name) {
    case 'Profile Pro':
      result.earned = isProfileComplete(context.profile);
      result.metadata = {
        source: 'profile',
        calculationMethod: 'profile_completeness',
        achievementDate: new Date().toISOString(),
        version: '1.0',
        customData: {
          hasUsername: !!context.profile.username,
          hasEmail: !!context.profile.email,
          hasAvatar: !!context.profile.avatar_url,
        },
      };
      break;

    case 'Staking Starter':
      result.earned = context.hasStakes || false;
      result.metadata = {
        source: 'system',
        calculationMethod: 'staking_status',
        achievementDate: new Date().toISOString(),
        version: '1.0',
        customData: {
          hasStakes: context.hasStakes || false,
        },
      };
      break;

    case 'Premium Member':
      result.earned = context.isPremium || false;
      result.metadata = {
        source: 'system',
        calculationMethod: 'premium_status',
        achievementDate: new Date().toISOString(),
        version: '1.0',
        customData: {
          isPremium: context.isPremium || false,
        },
      };
      break;

    case 'First Steps':
      result.earned = context.activities.length >= 1;
      result.metadata = {
        source: 'activity',
        calculationMethod: 'activity_count',
        achievementDate: new Date().toISOString(),
        version: '1.0',
        customData: {
          totalActivities: context.activities.length,
        },
      };
      break;
  }

  return result;
}

/**
 * Main function to check if a badge should be awarded
 */
export function checkBadgeEligibility(badge: IBadge, context: BadgeCheckContext): BadgeCheckResult {
  // Check if user already has this badge
  const alreadyHas = context.userBadges.some((ub) => ub.badge_id === badge.id);
  if (alreadyHas) {
    return {
      badgeId: badge.id,
      earned: false, // Already has it
    };
  }

  switch (badge.category) {
    case 'distance':
      return checkDistanceBadges(badge, context);
    case 'steps':
      return checkStepBadges(badge, context);
    case 'streak':
      return checkStreakBadges(badge, context);
    case 'time':
      return checkTimeBadges(badge, context);
    case 'calories':
      return checkCalorieBadges(badge, context);
    case 'social':
      return checkSocialBadges(badge, context);
    case 'special':
      return checkSpecialBadges(badge, context);
    default:
      return {
        badgeId: badge.id,
        earned: false,
      };
  }
}

/**
 * Check multiple badges at once
 */
export function checkMultipleBadges(
  badges: IBadge[],
  context: BadgeCheckContext,
): BadgeCheckResult[] {
  return badges.map((badge) => checkBadgeEligibility(badge, context));
}
