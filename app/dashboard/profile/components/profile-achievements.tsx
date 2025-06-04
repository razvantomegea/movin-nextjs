'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { IActivity } from '@/lib/supabase/activities';
import { IUserBadge } from '@/lib/supabase/badges';
import { IProfile } from '@/lib/supabase/profile';
import { BadgeCheckResult } from '@/utils/badges/badgeChecker';
import { createBadgeManager, BadgeManager } from '@/utils/badges/badgeManager';
import { formatDate } from '@/utils/date';

interface ProfileAchievementsProps {
  address: string;
  activities: IActivity[];
  profile: IProfile;
}

export function ProfileAchievements({ address, activities, profile }: ProfileAchievementsProps) {
  const [userBadges, setUserBadges] = useState<IUserBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<Record<string, BadgeCheckResult>>({});
  const [badgeManager, setBadgeManager] = useState<BadgeManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<IUserBadge[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBadgeData = async () => {
      if (!address) return;

      try {
        setIsLoading(true);

        // Initialize badge manager with fresh data
        const manager = await createBadgeManager(address);
        setBadgeManager(manager);

        await manager.checkAndAwardBadges({
          activities,
          profile,
          isPremium: profile.is_premium,
          hasStakes: false,
        });

        // Get user badges (including any newly awarded ones)
        const badges = manager.getUserBadges();
        setUserBadges(badges);

        // Get progress for all badges
        const progress = manager.getBadgeProgress();
        setBadgeProgress(progress);
      } catch (error) {
        console.error('Failed to load badge data:', error);
        setError('Failed to load achievements. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBadgeData();
  }, [address, activities, profile]);

  // Icon mapping to handle different icon names
  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      award: LucideIcons.Award,
      trophy: LucideIcons.Trophy,
      star: LucideIcons.Star,
      medal: LucideIcons.Medal,
      crown: LucideIcons.Crown,
      target: LucideIcons.Target,
      zap: LucideIcons.Zap,
      flame: LucideIcons.Flame,
      heart: LucideIcons.Heart,
      clock: LucideIcons.Clock,
      calendar: LucideIcons.Calendar,
      users: LucideIcons.Users,
      user: LucideIcons.User,
      shield: LucideIcons.Shield,
      gem: LucideIcons.Gem,
      diamond: LucideIcons.Diamond,
      sunrise: LucideIcons.Sunrise,
      moon: LucideIcons.Moon,
      footprints: LucideIcons.Footprints,
      activity: LucideIcons.Activity,
      trending_up: LucideIcons.TrendingUp,
      trending_down: LucideIcons.TrendingDown,
      mountain: LucideIcons.Mountain,
      map_pin: LucideIcons.MapPin,
      compass: LucideIcons.Compass,
      // Add more mappings as needed
    };

    // Normalize icon name (lowercase, replace spaces/hyphens with underscores)
    const normalizedIconName = iconName.toLowerCase().replace(/[-\s]/g, '_');

    return iconMap[normalizedIconName] || iconMap[iconName] || LucideIcons.Award;
  };

  const renderBadgeIcon = (iconName: string, className: string = 'h-6 w-6') => {
    const Icon = getIconComponent(iconName);
    return <Icon className={className} />;
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Error loading achievements. Please try again later.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Loading your badges and progress...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-lg h-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedBadges = userBadges.filter((ub) => ub.badge);
  const availableBadges = badgeManager?.getAllBadges() || [];
  const unearnedBadges = availableBadges.filter(
    (badge) => !userBadges.some((ub) => ub.badge_id === badge.id),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Achievements
          <div className="flex items-center space-x-2">
            {newlyEarnedBadges.length > 0 && (
              <Badge variant="default" className="bg-green-500 text-white">
                +{newlyEarnedBadges.length} new!
              </Badge>
            )}
            <Badge variant="secondary">
              {userBadges.length} / {availableBadges.length}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription>
          Badges and rewards you&apos;ve earned through your activities
        </CardDescription>
      </CardHeader>
      <CardContent>
        {earnedBadges.length > 0 ? (
          <div className="space-y-6">
            {/* Earned Badges */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-green-600 dark:text-green-400 flex items-center">
                🎉 Earned Badges
                <span className="ml-2 text-xs text-gray-500">({earnedBadges.length})</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {earnedBadges.map((userBadge, i) => {
                  if (!userBadge.badge) return null;

                  const isNewlyEarned = newlyEarnedBadges.some(
                    (nb) => nb.badge_id === userBadge.badge_id,
                  );

                  return (
                    <motion.div
                      key={userBadge.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center space-x-3 p-3 rounded-lg border relative ${
                        isNewlyEarned
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {isNewlyEarned && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute -top-1 -left-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded-full z-10"
                        >
                          NEW!
                        </motion.div>
                      )}
                      <div
                        className="p-2 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: userBadge.badge.color + '20',
                          color: userBadge.badge.color,
                        }}
                      >
                        {renderBadgeIcon(userBadge.badge.icon, 'h-5 w-5')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm truncate">
                            {userBadge.badge.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {userBadge.badge.rarity}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">
                          {userBadge.badge.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Earned {formatDate(userBadge.earned_at).split(' ')[0]}</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ✓ Complete
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Progress on Available Badges */}
            {unearnedBadges.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 text-blue-600 dark:text-blue-400 flex items-center">
                  🎯 Available Badges
                  <span className="ml-2 text-xs text-gray-500">({unearnedBadges.length})</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unearnedBadges.map((badge, i) => {
                    const progress = badgeProgress[badge.id];
                    const progressPercentage = progress?.progress?.percentage || 0;

                    return (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
                      >
                        <div
                          className="p-2 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: badge.color + '20',
                            color: badge.color,
                          }}
                        >
                          {renderBadgeIcon(badge.icon, 'h-5 w-5')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm truncate">{badge.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {badge.rarity}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                            {badge.description}
                          </p>
                          {progress?.progress && (
                            <div className="space-y-1">
                              <Progress value={progressPercentage} className="h-1" />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>
                                  {progress.progress.current} / {progress.progress.required}
                                  {badge.requirement_unit && ` ${badge.requirement_unit}`}
                                </span>
                                <span>{Math.round(progressPercentage)}%</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium mb-2">Start Your Journey</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Complete activities to earn your first badges!
            </p>
            {availableBadges.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
                {availableBadges.map((badge, i) => (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center opacity-60"
                  >
                    <div
                      className="p-3 rounded-full mb-2"
                      style={{
                        backgroundColor: badge.color + '20',
                        color: badge.color,
                      }}
                    >
                      {renderBadgeIcon(badge.icon)}
                    </div>
                    <span className="font-medium text-sm">{badge.name}</span>
                    <Badge variant="outline" className="text-xs mt-1">
                      {badge.rarity}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
