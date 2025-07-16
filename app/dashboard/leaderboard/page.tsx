'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Crown, Flame, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ILeaderboardUser } from '@/lib/supabase/profile';
import { formatAddress } from '@/utils/crypto';

interface LeaderboardData {
  leaderboard: ILeaderboardUser[];
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<ILeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/leaderboard?limit=50');
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }
        const data: LeaderboardData = await response.json();
        setLeaderboard(data.leaderboard);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <Trophy className="h-5 w-5 text-gray-500" />;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white border-yellow-500';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white border-gray-400';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white border-amber-500';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  const getCardClassName = (rank: number) => {
    switch (rank) {
      case 1:
        return 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 shadow-lg';
      case 2:
        return 'border-2 border-gray-400 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 shadow-lg';
      case 3:
        return 'border-2 border-amber-400 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 shadow-lg';
      default:
        return 'border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Leaderboard
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
            Top performers ranked by level
          </p>
        </div>

        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Leaderboard</h1>
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
          Top performers ranked by level
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400">No users found</h3>
          <p className="text-gray-500 dark:text-gray-500">
            Be the first to appear on the leaderboard!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            return (
              <Card key={user.address} className={getCardClassName(rank)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="flex items-center justify-center min-w-[3rem]">
                      <div
                        className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeVariant(
                          rank,
                        )}`}
                      >
                        {rank <= 3 ? (
                          getRankIcon(rank)
                        ) : (
                          <span className="font-bold text-lg">#{rank}</span>
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div
                      className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors px-2 py-1"
                      title="View profile"
                      onClick={() => router.push(`/dashboard/profile?address=${user.address}`)}
                    >
                      <Avatar className="h-12 w-12 border-2 border-blue-500">
                        <AvatarImage
                          src={user.avatar_url || '/placeholder.svg?height=48&width=48'}
                          alt={user.username || 'User'}
                        />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                          {(user.username || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {user.username.startsWith('0x')
                            ? formatAddress(user.username)
                            : user.username}
                        </h3>
                        <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <Badge variant="secondary" className="text-xs font-bold px-2 py-0.5">
                            Level {user.level}
                          </Badge>
                          {user.streak_days > 0 && (
                            <div className="flex items-center gap-1">
                              <Flame className="h-3 w-3 text-orange-500" />
                              <span>
                                {user.streak_days} day{user.streak_days !== 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                          {user.total_earned != null && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{user.total_earned?.toFixed(2)} MVN</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
