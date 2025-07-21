'use client';

import { useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ExerciseProgress } from '@/types/workouts';
import { getMetricStats } from '@/utils/workouts/getMetricStats';

interface ExerciseProgressChartProps {
  progressData: ExerciseProgress[];
  selectedMetric: 'weight' | 'volume' | 'reps' | 'time_under_tension';
  weightUnit: string;
  isLoading: boolean;
}

interface ChartDataPoint {
  session: number;
  date: string;
  weight: number;
  volume: number;
  reps: number;
  time_under_tension: number;
  displayDate: string;
}

const chartAnimationVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export function ExerciseProgressChart({
  progressData,
  selectedMetric,
  weightUnit,
  isLoading,
}: ExerciseProgressChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const uniqueGradientId = useId();

  // Transform progress data for the chart
  const chartData: ChartDataPoint[] = useMemo(() => {
    // Sort progress data chronologically by date
    const sortedData = [...progressData].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    return sortedData.map((progress, index) => ({
      session: index + 1,
      date: new Date(progress.date).toLocaleDateString(),
      weight: progress.maxWeight,
      volume: progress.totalVolume,
      reps: progress.totalReps,
      time_under_tension: progress.totalTimeUnderTension ?? 0,
      displayDate: new Date(progress.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }));
  }, [progressData]);

  const hasData = chartData.length > 0;

  const stats = getMetricStats(chartData, selectedMetric, weightUnit);

  // Get chart color based on metric
  const getChartColor = () => {
    switch (selectedMetric) {
      case 'weight':
        return isDark ? '#10b981' : '#059669'; // Green
      case 'volume':
        return isDark ? '#3b82f6' : '#2563eb'; // Blue
      case 'reps':
        return isDark ? '#8b5cf6' : '#7c3aed'; // Purple
      case 'time_under_tension':
        return isDark ? '#f59e42' : '#d97706'; // Orange
      default:
        return isDark ? '#3b82f6' : '#2563eb';
    }
  };

  const chartColor = getChartColor();

  const metricLabel =
    selectedMetric === 'weight'
      ? 'Weight'
      : selectedMetric === 'volume'
        ? 'Volume'
        : selectedMetric === 'reps'
          ? 'Total Reps'
          : 'TUT (s)';

  return (
    <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
      <CardContent className="p-6">
        {/* Chart container with fixed height */}
        <div className="h-80 mt-4 mb-4 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-500">Loading progress data...</span>
            </div>
          ) : !hasData ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-lg text-gray-500">No progress data available</p>
              <p className="text-sm text-gray-400 mt-2">
                Complete more workouts to see your progress over time.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedMetric}
                variants={chartAnimationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full w-full"
              >
                <ChartContainer
                  config={{
                    [selectedMetric]: {
                      label: metricLabel,
                      color: chartColor,
                    },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id={uniqueGradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                          <stop offset="95%" stopColor={chartColor} stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
                      />
                      <XAxis
                        dataKey="displayDate"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent />}
                        labelFormatter={(label) => `Session ${label}`}
                      />
                      <Line
                        type="monotone"
                        dataKey={selectedMetric}
                        stroke={chartColor}
                        strokeWidth={3}
                        dot={{ fill: chartColor, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: chartColor }}
                        animationDuration={1000}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Stats Summary */}
        {hasData && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">Current</div>
              <div className="text-lg font-bold">
                {stats.current.toLocaleString()} {stats.unit}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">Best</div>
              <div className="text-lg font-bold text-green-600">
                {stats.best.toLocaleString()} {stats.unit}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">Improvement</div>
              <div
                className={`text-lg font-bold ${
                  stats.improvement >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stats.improvement >= 0 ? '+' : ''}
                {Math.round(stats.improvement)}%
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
