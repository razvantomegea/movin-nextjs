'use client';

import { useState, useId, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface ExerciseDetailChartProps {
  metric: 'steps' | 'calories' | 'distance' | 'duration' | 'mets';
  weeklyData: TimeRangeData[];
  monthlyData: TimeRangeData[];
  yearlyData: TimeRangeData[];
  isLoading: boolean;
}

type ChartType = 'area' | 'bar';

export function ExerciseDetailChart({
  metric,
  weeklyData,
  monthlyData,
  yearlyData,
  isLoading,
}: ExerciseDetailChartProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [chartType, setChartType] = useState<ChartType>('area');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Generate unique IDs for gradients
  const uniqueBgGradientId = useId();
  const uniqueAreaGradientId = useId();

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

  // Calculate statistics
  const stats = useMemo(() => {
    if (!hasData) return { total: 0, average: 0, max: 0, min: 0, trend: 0 };

    const values = filteredData.map((item) => item[metric] as number).filter((val) => val > 0);
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Calculate trend (simple linear regression slope)
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    values.forEach((val, index) => {
      sumX += index;
      sumY += val;
      sumXY += index * val;
      sumXX += index * index;
    });

    const trend = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;

    return { total, average, max, min, trend };
  }, [filteredData, metric, hasData]);

  const getMetricTitle = () => {
    switch (metric) {
      case 'steps':
        return 'Steps Analysis';
      case 'calories':
        return 'Calories Burned Analysis';
      case 'distance':
        return 'Distance Coverage Analysis';
      case 'duration':
        return 'Active Duration Analysis';
      case 'mets':
        return 'METs Analysis';
      default:
        return 'Activity Analysis';
    }
  };

  const getMetricColor = () => {
    switch (metric) {
      case 'steps':
        return '#3b82f6'; // blue
      case 'calories':
        return '#f97316'; // orange
      case 'distance':
        return '#10b981'; // green
      case 'duration':
        return '#8b5cf6'; // purple
      case 'mets':
        return '#ec4899'; // pink
      default:
        return '#3b82f6';
    }
  };

  const renderChart = () => {
    const chartColor = getMetricColor();
    
    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id={uniqueBgGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isDark ? chartColor : '#f3f4f6'}
                  stopOpacity={isDark ? 0.1 : 0.8}
                />
                <stop
                  offset="100%"
                  stopColor={isDark ? chartColor : '#f9fafb'}
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
            <Bar
              dataKey={metric}
              fill={chartColor}
              opacity={0.8}
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={filteredData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id={uniqueBgGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={isDark ? chartColor : '#f3f4f6'}
                stopOpacity={isDark ? 0.1 : 0.8}
              />
              <stop
                offset="100%"
                stopColor={isDark ? chartColor : '#f9fafb'}
                stopOpacity={isDark ? 0.02 : 0.3}
              />
            </linearGradient>
            <linearGradient id={uniqueAreaGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={chartColor} stopOpacity={0.8} />
              <stop offset="100%" stopColor={chartColor} stopOpacity={0.1} />
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
            stroke={chartColor}
            fillOpacity={1}
            fill={`url(#${uniqueAreaGradientId})`}
            strokeWidth={2.5}
            activeDot={{ r: 6, strokeWidth: 0, fill: chartColor }}
            animationDuration={1000}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
      <CardHeader className="pb-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold">{getMetricTitle()}</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Detailed breakdown of your {metric} performance over time
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Tabs
              value={chartType}
              onValueChange={(value) => setChartType(value as ChartType)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid grid-cols-2 w-full sm:w-auto">
                <TabsTrigger value="area">Area</TabsTrigger>
                <TabsTrigger value="bar">Bar</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs
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
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Statistics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatActivityValue(stats.total, metric)}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Total {getActivityUnit(metric)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatActivityValue(stats.average, metric)}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Average {getActivityUnit(metric)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatActivityValue(stats.max, metric)}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Peak {getActivityUnit(metric)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatActivityValue(stats.min, metric)}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Minimum {getActivityUnit(metric)}
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center">
              <div className="text-2xl font-bold flex items-center">
                {stats.trend > 0 ? (
                  <TrendingUp className="h-6 w-6 text-green-500 mr-1" />
                ) : stats.trend < 0 ? (
                  <TrendingDown className="h-6 w-6 text-red-500 mr-1" />
                ) : (
                  <Minus className="h-6 w-6 text-gray-500 mr-1" />
                )}
                <span className={`${
                  stats.trend > 0 ? 'text-green-500' : 
                  stats.trend < 0 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Trend
            </div>
          </div>
        </div>

        {/* Chart container with fixed height */}
        <div className="h-96 mt-8 mb-4 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-500">Loading chart data...</span>
            </div>
          ) : !hasData ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="text-lg text-gray-500">No {metric} data available for this period.</p>
              <p className="text-sm text-gray-400 mt-2">
                Try selecting a different time range or start tracking your activities.
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${metric}-${timeRange}-${chartType}`}
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
                      color: getMetricColor(),
                    },
                  }}
                  className="h-full w-full"
                >
                  {renderChart()}
                </ChartContainer>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </CardContent>
    </Card>
  );
}