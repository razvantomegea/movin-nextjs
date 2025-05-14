'use client';

import { motion } from 'framer-motion';
import { Star, Trophy, Flame, Award, Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function ProfileAchievements() {
  const achievements = [
    {
      name: 'Early Bird',
      icon: <Star className="h-6 w-6 text-yellow-500" />,
      date: 'Apr 20',
    },
    {
      name: 'Step Master',
      icon: <Trophy className="h-6 w-6 text-blue-500" />,
      date: 'Apr 18',
    },
    {
      name: 'Week Warrior',
      icon: <Flame className="h-6 w-6 text-orange-500" />,
      date: 'Apr 15',
    },
    {
      name: 'Goal Crusher',
      icon: <Award className="h-6 w-6 text-purple-500" />,
      date: 'Apr 10',
    },
    {
      name: 'First Workout',
      icon: <Activity className="h-6 w-6 text-green-500" />,
      date: 'Apr 5',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Achievements</CardTitle>
        <CardDescription>Badges and rewards you&apos;ve earned</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {achievements.map((achievement, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center"
            >
              <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full mb-2">
                {achievement.icon}
              </div>
              <span className="font-medium text-sm">{achievement.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{achievement.date}</span>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
