'use client';

import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ExerciseMetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  unit: string;
  goal?: number;
  isSelected: boolean;
  onClick: () => void;
  color: 'blue' | 'orange' | 'green' | 'purple' | 'pink';
}

export function ExerciseMetricCard({
  icon,
  title,
  value,
  unit,
  goal,
  isSelected,
  onClick,
  color,
}: ExerciseMetricCardProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-500',
          selected: 'ring-2 ring-blue-500/50 bg-blue-500/20',
          hover: 'hover:bg-blue-500/10',
        };
      case 'orange':
        return {
          bg: 'bg-orange-500/10',
          text: 'text-orange-500',
          selected: 'ring-2 ring-orange-500/50 bg-orange-500/20',
          hover: 'hover:bg-orange-500/10',
        };
      case 'green':
        return {
          bg: 'bg-green-500/10',
          text: 'text-green-500',
          selected: 'ring-2 ring-green-500/50 bg-green-500/20',
          hover: 'hover:bg-green-500/10',
        };
      case 'purple':
        return {
          bg: 'bg-purple-500/10',
          text: 'text-purple-500',
          selected: 'ring-2 ring-purple-500/50 bg-purple-500/20',
          hover: 'hover:bg-purple-500/10',
        };
      case 'pink':
        return {
          bg: 'bg-pink-500/10',
          text: 'text-pink-500',
          selected: 'ring-2 ring-pink-500/50 bg-pink-500/20',
          hover: 'hover:bg-pink-500/10',
        };
      default:
        return {
          bg: 'bg-blue-500/10',
          text: 'text-blue-500',
          selected: 'ring-2 ring-blue-500/50 bg-blue-500/20',
          hover: 'hover:bg-blue-500/10',
        };
    }
  };

  const colorClasses = getColorClasses(color);
  const percentage = goal ? Math.min((value / goal) * 100, 100) : 0;

  const formatValue = (val: number) => {
    if (title === 'Distance' && unit === 'km') {
      return val.toFixed(1);
    }
    if (title === 'Duration' && unit === 'min') {
      const hours = Math.floor(val / 60);
      const minutes = Math.round(val % 60);
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    return val.toLocaleString();
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
        } ${
          isSelected
            ? colorClasses.selected
            : `${colorClasses.hover} hover:shadow-md`
        }`}
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-full ${colorClasses.bg}`}>
              <div className={colorClasses.text}>
                {icon}
              </div>
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`w-2 h-2 rounded-full ${colorClasses.text.replace('text-', 'bg-')}`}
              />
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {title}
              </h3>
              <span className="text-xs text-gray-500">
                {unit && `${unit}`}
              </span>
            </div>
            
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold">
                {formatValue(value)}
              </span>
              {goal && (
                <span className="text-sm text-gray-500">
                  / {formatValue(goal)}
                </span>
              )}
            </div>
            
            {goal && (
              <div className="space-y-1">
                <Progress 
                  value={percentage} 
                  className="h-2"
                  // Apply color based on metric
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{percentage.toFixed(0)}%</span>
                  <span>Goal</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}