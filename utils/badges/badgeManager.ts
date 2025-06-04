import { IActivity } from '@/lib/supabase/activities';
import {
  getAllBadges,
  getUserBadges,
  awardBadge,
  IBadge,
  IUserBadge,
  BadgeProgressData,
} from '@/lib/supabase/badges';
import { IProfile } from '@/lib/supabase/profile';
import { BadgeCheckContext, BadgeCheckResult, checkMultipleBadges } from './badgeChecker';

export interface BadgeManagerResult {
  newBadges: IUserBadge[];
  progress: Record<string, BadgeCheckResult>;
  errors: string[];
}

/**
 * Main badge manager class
 */
export class BadgeManager {
  private address: string;
  private allBadges: IBadge[] = [];
  private userBadges: IUserBadge[] = [];
  private initialized = false;

  constructor(address: string) {
    this.address = address;
  }

  /**
   * Initialize the badge manager with current data
   */
  async initialize(): Promise<void> {
    try {
      if (this.initialized) {
        return;
      }

      [this.allBadges, this.userBadges] = await Promise.all([
        getAllBadges(),
        getUserBadges({ address: this.address }),
      ]);

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize badge manager:', error);
      throw error;
    }
  }

  /**
   * Check and award badges based on current context
   */
  async checkAndAwardBadges(
    context: Omit<BadgeCheckContext, 'userBadges'>,
  ): Promise<BadgeManagerResult> {
    const result: BadgeManagerResult = {
      newBadges: [],
      progress: {},
      errors: [],
    };

    try {
      // Make sure we have the latest data
      if (!this.initialized) {
        await this.initialize();
      }

      const fullContext: BadgeCheckContext = {
        ...context,
        userBadges: this.userBadges,
      };

      // Check all badges
      const badgeResults = checkMultipleBadges(this.allBadges, fullContext);

      // Process results
      for (const badgeResult of badgeResults) {
        result.progress[badgeResult.badgeId] = badgeResult;

        if (badgeResult.earned) {
          try {
            const progressData: BadgeProgressData | undefined = badgeResult.progress
              ? {
                  current: badgeResult.progress.current,
                  required: badgeResult.progress.required,
                  percentage: badgeResult.progress.percentage,
                  lastUpdated: new Date().toISOString(),
                  metadata: badgeResult.metadata,
                }
              : badgeResult.progressData;

            const newBadge = await awardBadge({
              address: this.address,
              badgeId: badgeResult.badgeId,
              progressData,
            });

            result.newBadges.push(newBadge);

            // Update local cache
            this.userBadges.push(newBadge);
          } catch (error) {
            // Supabase/PostgREST wraps sqlstate in `code`
            if ((error as { code: string })?.code === '23505') {
              // User already has this badge, ignore
              continue;
            }

            const errorMsg = `Failed to award badge ${badgeResult.badgeId}: ${error}`;
            console.error(errorMsg);
            result.errors.push(errorMsg);
          }
        }
      }
    } catch (error) {
      const errorMsg = `Badge check failed: ${error}`;
      console.error(errorMsg);
      result.errors.push(errorMsg);
    }

    return result;
  }

  /**
   * Check badges specifically for a new activity
   */
  async checkNewActivityBadges(
    newActivity: IActivity,
    allActivities: IActivity[],
    profile: IProfile,
    isPremium?: boolean,
    hasStakes?: boolean,
  ): Promise<BadgeManagerResult> {
    return this.checkAndAwardBadges({
      activities: allActivities,
      profile,
      newActivity,
      isPremium,
      hasStakes,
    });
  }

  /**
   * Get badge progress for a specific category
   */
  getBadgeProgress(
    category?: string,
    activities: IActivity[] = [],
    profile: IProfile | null = null,
    isPremium?: boolean,
    hasStakes?: boolean,
  ): Record<string, BadgeCheckResult> {
    const filteredBadges = category
      ? this.allBadges.filter((badge) => badge.category === category)
      : this.allBadges;

    const context: BadgeCheckContext = {
      activities: activities,
      profile:
        profile ??
        ({
          streak_days: 0,
          created_at: new Date().toISOString(),
        } as unknown as IProfile),
      userBadges: this.userBadges,
      isPremium,
      hasStakes,
    };

    const results = checkMultipleBadges(filteredBadges, context);
    const progress: Record<string, BadgeCheckResult> = {};

    results.forEach((result) => {
      progress[result.badgeId] = result;
    });

    return progress;
  }

  /**
   * Get user's badge statistics
   */
  getStats() {
    const stats = {
      total: this.userBadges.length,
      byRarity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      recent: this.userBadges.slice(0, 5),
    };

    this.userBadges.forEach((userBadge) => {
      if (userBadge.badge) {
        const rarity = userBadge.badge.rarity;
        const category = userBadge.badge.category;

        stats.byRarity[rarity] = (stats.byRarity[rarity] || 0) + 1;
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Check if user has a specific badge
   */
  hasBadge(badgeId: string): boolean {
    return this.userBadges.some((userBadge) => userBadge.badge_id === badgeId);
  }

  /**
   * Get all available badges
   */
  getAllBadges(): IBadge[] {
    return this.allBadges;
  }

  /**
   * Get user's earned badges
   */
  getUserBadges(): IUserBadge[] {
    return this.userBadges;
  }

  /**
   * Refresh badge data
   */
  async refresh(): Promise<void> {
    this.initialized = false;
    await this.initialize();
  }
}

/**
 * Utility function to create and initialize a badge manager
 */
export async function createBadgeManager(address: string): Promise<BadgeManager> {
  const manager = new BadgeManager(address);
  await manager.initialize();
  return manager;
}

/**
 * Quick function to check and award badges for a new activity
 */
export async function checkNewActivityBadges(
  address: string,
  newActivity: IActivity,
  allActivities: IActivity[],
  profile: IProfile,
  isPremium?: boolean,
  hasStakes?: boolean,
): Promise<BadgeManagerResult> {
  const manager = await createBadgeManager(address);
  return manager.checkNewActivityBadges(newActivity, allActivities, profile, isPremium, hasStakes);
}
