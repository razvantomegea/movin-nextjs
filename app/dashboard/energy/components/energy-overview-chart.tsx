'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NutritionTimeRangeData } from '@/utils/movin/energyMappers';

interface EnergyOverviewChartProps {
  weeklyData: NutritionTimeRangeData[];
  monthlyData: NutritionTimeRangeData[];
  yearlyData: NutritionTimeRangeData[];
}

type MetricType = 'calories' | 'carbohydrates' | 'fats' | 'protein';

export function EnergyOverviewChart({
  weeklyData,
  monthlyData,
  yearlyData,
}: EnergyOverviewChartProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [metric, setMetric] = useState<MetricType>('calories');
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

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

  // Get the unit for the selected metric
  const getUnit = () => {
    switch (metric) {
      case 'calories':
        return 'kcal';
      case 'carbohydrates':
      case 'fats':
      case 'protein':
        return 'g';
      default:
        return '';
    }
  };

  // Format the value based on the metric
  const formatValue = (value: number) => {
    switch (metric) {
      case 'calories':
        return value.toLocaleString();
      case 'carbohydrates':
      case 'fats':
      case 'protein':
        return value.toLocaleString();
      default:
        return value.toString();
    }
  };

  const data = getData();
  const hasData = data.length > 0;
  const totalValue = hasData ? data.reduce((sum, item) => sum + item[metric], 0) : 0;

  // Get the color for the chart based on the metric and theme
  const getChartColor = () => {
    switch (metric) {
      case 'calories':
        return isDark ? '#3b82f6' : '#2563eb'; // blue
      case 'carbohydrates':
        return isDark ? '#60a5fa' : '#3b82f6'; // lighter blue
      case 'fats':
        return isDark ? '#facc15' : '#eab308'; // yellow
      case 'protein':
        return isDark ? '#4ade80' : '#22c55e'; // green
      default:
        return isDark ? '#3b82f6' : '#2563eb';
    }
  };

  // Get the label for the selected metric
  const getMetricLabel = () => {
    switch (metric) {
      case 'calories':
        return 'Calories (kcal)';
      case 'carbohydrates':
        return 'Carbs (g)';
      case 'fats':
        return 'Fats (g)';
      case 'protein':
        return 'Protein (g)';
      default:
        return '';
    }
  };

  // Animation variants for chart transitions
  const chartVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.3,
        ease: 'easeIn',
      },
    },
  };

  return (
    <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <Tabs
            defaultValue="calories"
            value={metric}
            onValueChange={(value) => setMetric(value as MetricType)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid grid-cols-4 w-full sm:w-auto">
              <TabsTrigger value="calories">Calories</TabsTrigger>
              <TabsTrigger value="carbohydrates">Carbs</TabsTrigger>
              <TabsTrigger value="fats">Fats</TabsTrigger>
              <TabsTrigger value="protein">Protein</TabsTrigger>
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
          {!hasData ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              <span className="ml-2 text-gray-500">Loading data...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${metric}-${timeRange}`}
                variants={chartVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="h-full w-full"
              >
                <ChartContainer
                  config={{
                    [metric]: {
                      label: getMetricLabel(),
                      color: getChartColor(),
                    },
                  }}
                  className="h-full w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMetricDark" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1f2937" stopOpacity={0.9} />
                          <stop offset="50%" stopColor="#1f2937" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#1f2937" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="colorMetricLight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e5e7eb" stopOpacity={0.9} />
                          <stop offset="50%" stopColor="#e5e7eb" stopOpacity={0.6} />
                          <stop offset="100%" stopColor="#e5e7eb" stopOpacity={0.3} />
                        </linearGradient>
                        <linearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor={isDark ? getChartColor() : '#f3f4f6'}
                            stopOpacity={isDark ? 0.1 : 0.8}
                          />
                          <stop
                            offset="100%"
                            stopColor={isDark ? getChartColor() : '#f9fafb'}
                            stopOpacity={isDark ? 0.02 : 0.3}
                          />
                        </linearGradient>
                      </defs>
                      <rect x="0" y="0" width="100%" height="100%" fill="url(#bgGradient)" rx="4" />
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
                      />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickLine={false}
                        axisLine={{ stroke: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}
                        tickFormatter={(value) => formatValue(value)}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey={metric}
                        stroke={getChartColor()}
                        fillOpacity={0.8}
                        fill={isDark ? 'rgb(31 41 55 / 0.5)' : 'rgb(229 231 235 / 0.7)'}
                        strokeWidth={2.5}
                        activeDot={{ r: 6, strokeWidth: 0, fill: getChartColor() }}
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
            {metric === 'calories' && 'Total Calories'}
            {metric === 'carbohydrates' && 'Total Carbs'}
            {metric === 'fats' && 'Total Fats'}
            {metric === 'protein' && 'Total Protein'}
          </div>
          <div className="text-xl font-bold">
            {hasData ? formatValue(totalValue) : '0'} {getUnit()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
