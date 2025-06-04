import { RouteData } from '@/app/dashboard/components/route-tracking-modal';
import { IPremiumStatus } from '@/lib/hooks/useMovinEarn';
import { IActivity } from '@/lib/supabase/activities';
import { IProfile } from '@/lib/supabase/profile';
import { mapRouteToActivity } from '@/utils/movin/mapRouteToActivity';
import { checkNewActivityBadges, BadgeManagerResult } from './badgeManager';

export interface BadgeNotification {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    rarity: string;
  };
  earnedAt: string;
}

/**
 * Handle badge checking after a new activity is completed
 * This should be called after saving a new activity to the database
 */
export async function handleActivityCompleteBadges({
  address,
  newActivity,
  allActivities,
  profile,
  premiumStatus,
  hasStakes,
  onBadgeEarned,
}: {
  address: string;
  newActivity: IActivity;
  allActivities: IActivity[];
  profile: IProfile;
  premiumStatus?: IPremiumStatus;
  hasStakes?: boolean;
  onBadgeEarned?: (badges: BadgeNotification[]) => void;
}): Promise<BadgeManagerResult> {
  try {
    const result = await checkNewActivityBadges(
      address,
      newActivity,
      allActivities,
      profile,
      premiumStatus,
      hasStakes,
    );

    // Transform new badges to notifications
    if (result.newBadges.length > 0 && onBadgeEarned) {
      const notifications: BadgeNotification[] = result.newBadges.map((userBadge) => ({
        badge: {
          id: userBadge.badge?.id || '',
          name: userBadge.badge?.name || '',
          description: userBadge.badge?.description || '',
          icon: userBadge.badge?.icon || 'award',
          color: userBadge.badge?.color || '#6366f1',
          rarity: userBadge.badge?.rarity || 'common',
        },
        earnedAt: userBadge.earned_at,
      }));

      onBadgeEarned(notifications);
    }

    return result;
  } catch (error) {
    console.error('Error checking badges after activity completion:', error);
    return {
      newBadges: [],
      progress: {},
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Handle badge checking after route tracking is completed
 * This integrates with the route tracking modal
 */
export async function handleRouteCompleteBadges({
  address,
  routeData,
  allActivities,
  profile,
  premiumStatus,
  hasStakes,
  onBadgeEarned,
}: {
  address: string;
  routeData: RouteData;
  allActivities: IActivity[];
  profile: IProfile;
  premiumStatus?: IPremiumStatus;
  hasStakes?: boolean;
  onBadgeEarned?: (badges: BadgeNotification[]) => void;
}): Promise<BadgeManagerResult> {
  try {
    // Convert route data to activity format
    const activityData = mapRouteToActivity(routeData, address);

    // Create a mock activity object for badge checking
    const mockActivity: IActivity = {
      id: Date.now().toString(),
      address,
      name: activityData.name || 'Route Activity',
      source: activityData.source || 'Route Tracking',
      start_date: activityData.start_date || new Date().toISOString(),
      end_date: activityData.end_date || new Date().toISOString(),
      duration: activityData.duration || 0,
      total_energy_burned: activityData.total_energy_burned || 0,
      total_distance: activityData.total_distance || 0,
      total_steps: activityData.total_steps || 0,
      maximum_heart_rate: activityData.maximum_heart_rate || 0,
      average_heart_rate: activityData.average_heart_rate || 0,
      minimum_heart_rate: activityData.minimum_heart_rate || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return handleActivityCompleteBadges({
      address,
      newActivity: mockActivity,
      allActivities,
      profile,
      premiumStatus,
      hasStakes,
      onBadgeEarned,
    });
  } catch (error) {
    console.error('Error checking badges after route completion:', error);
    return {
      newBadges: [],
      progress: {},
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Handle badge checking after profile updates
 */
export async function handleProfileUpdateBadges({
  address,
  activities,
  updatedProfile,
  premiumStatus,
  hasStakes,
  onBadgeEarned,
}: {
  address: string;
  activities: IActivity[];
  updatedProfile: IProfile;
  premiumStatus?: IPremiumStatus;
  hasStakes?: boolean;
  onBadgeEarned?: (badges: BadgeNotification[]) => void;
}): Promise<BadgeManagerResult> {
  try {
    const { createBadgeManager } = await import('./badgeManager');
    const manager = await createBadgeManager(address);

    const result = await manager.checkProfileBadges(
      activities,
      updatedProfile,
      premiumStatus,
      hasStakes,
    );

    // Transform new badges to notifications
    if (result.newBadges.length > 0 && onBadgeEarned) {
      const notifications: BadgeNotification[] = result.newBadges.map((userBadge) => ({
        badge: {
          id: userBadge.badge?.id || '',
          name: userBadge.badge?.name || '',
          description: userBadge.badge?.description || '',
          icon: userBadge.badge?.icon || 'award',
          color: userBadge.badge?.color || '#6366f1',
          rarity: userBadge.badge?.rarity || 'common',
        },
        earnedAt: userBadge.earned_at,
      }));

      onBadgeEarned(notifications);
    }

    return result;
  } catch (error) {
    console.error('Error checking badges after profile update:', error);
    return {
      newBadges: [],
      progress: {},
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    };
  }
}

/**
 * Create toast notifications for earned badges
 */
export function createBadgeToastNotifications(badges: BadgeNotification[]) {
  return badges.map(({ badge }) => ({
    title: `🎉 Badge Earned!`,
    description: `You've earned the "${badge.name}" badge!`,
    action: {
      label: 'View Badge',
      onClick: () => {
        // Could navigate to achievements page or show details modal
        console.log('Show badge details:', badge);
      },
    },
  }));
}
