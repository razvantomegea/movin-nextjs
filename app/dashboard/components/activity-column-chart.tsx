'use client';

import { useState, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  filterDataByTimeRange,
  getTickValues,
  formatActivityValue,
  getActivityUnit,
  getActivityMetricLabel,
  getActivityChartColor,
  chartAnimationVariants,
} from '@/utils/charts';
import { TimeRangeData } from '@/utils/movin/activityMappers';

interface ActivityColumnChartProps {
  weeklyData: TimeRangeData[];
  monthlyData: TimeRangeData[];
  yearlyData: TimeRangeData[];
  isLoading: boolean;
}

type MetricType = 'steps' | 'calories' | 'distance' | 'duration';

export function ActivityColumnChart({
  weeklyData,
  monthlyData,
  yearlyData,
  isLoading,
}: ActivityColumnChartProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [metric, setMetric] = useState<MetricType>('steps');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Generate unique IDs for gradients
  const uniqueBgGradientId = useId();

  // Get the appropriate data based on the selected time range
  const getData = () => {
    switch (timeRange) {
      case 'week':
        return weeklyData || [];
      case 'month':
        return monthlyData || [];
      case 'year':
        return yearlyData || [];
      default:
        return weeklyData || [];
    }
  };

  const data = useMemo(getData, [timeRange, weeklyData, monthlyData, yearlyData]);
  const filteredData = useMemo(() => filterDataByTimeRange(data, timeRange), [data, timeRange]);
  const tickValues = useMemo(() => getTickValues(timeRange), [timeRange]);
  const hasData = filteredData.length > 0;
  const totalValue = hasData
    ? filteredData.reduce(
        (sum: number, item: TimeRangeData) =>
          sum + (Number.isFinite(item[metric]) ? (item[metric] as number) : 0),
        0,
      )
    : 0;

  return (
    <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <Tabs
            defaultValue="steps"
            value={metric}
            onValueChange={(value) => setMetric(value as MetricType)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
              <TabsTrigger value="steps">Steps</TabsTrigger>
              <TabsTrigger value="calories">Calories</TabsTrigger>
              <TabsTrigger value="distance">Distance</TabsTrigger>
              <TabsTrigger value="duration">Duration</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs
            defaultValue="week"
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as 'week' | 'month' | 'year')}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Chart container with fixed height */}
        <div className="h-80 mt-8 mb-4 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-500">Loading data...</span>
            </div>
          ) : !hasData ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              {/* Optional: Add an illustration here */}
              {/* <img src="/path/to/no-activity-illustration.svg" alt="No activity" className="h-24 w-24 mb-4" /> */}
              <p className="text-lg text-gray-500">No activity recorded for this period.</p>
              <p className="text-sm text-gray-400">
                Try selecting a different time range or metric.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${metric}-${timeRange}`}
                variants={chartAnimationVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full w-full"
              >
                <ChartContainer
                  config={{
                    [metric]: {
                      label: getActivityMetricLabel(metric),
                      color: getActivityChartColor(isDark),
                    },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={filteredData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id={uniqueBgGradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={isDark ? getActivityChartColor(isDark) : '#f3f4f6'}
                            stopOpacity={isDark ? 0.1 : 0.8}
                          />
                          <stop
                            offset="100%"
                            stopColor={isDark ? getActivityChartColor(isDark) : '#f9fafb'}
                            stopOpacity={isDark ? 0.02 : 0.3}
                          />
                        </linearGradient>
                      </defs>
                      <rect
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill={`url(#${uniqueBgGradientId})`}
                        rx="4"
                      />
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                        ticks={tickValues}
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                        tickFormatter={(value) => formatActivityValue(value, metric)}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey={metric}
                        stroke={getActivityChartColor(isDark)}
                        fillOpacity={0.8}
                        fill={isDark ? 'rgb(31 41 55 / 0.5)' : 'rgb(229 231 235 / 0.7)'}
                        strokeWidth={2.5}
                        activeDot={{ r: 6, strokeWidth: 0, fill: getActivityChartColor(isDark) }}
                        animationDuration={1000}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="text-sm text-gray-500">
            {metric === 'steps' && 'Total Steps'}
            {metric === 'calories' && 'Total Calories'}
            {metric === 'distance' && 'Total Distance'}
            {metric === 'duration' && 'Total Duration'}
          </div>
          <div className="text-xl font-bold">
            {hasData ? formatActivityValue(totalValue, metric) : '0'}
            {getActivityUnit(metric) && ` ${getActivityUnit(metric)}`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
