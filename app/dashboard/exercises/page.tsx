'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { motion } from 'framer-motion';
import {
  Activity,
  Clock,
  Flame,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Target,
  Calendar,
  ArrowLeft,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorAlert } from '@/components/ui/error-alert';
import { RefreshButton } from '@/components/refresh-button';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { fetchActivities } from '@/lib/redux/slices/activityDataSlice';
import { fetchGoals } from '@/lib/redux/slices/goalsSlice';
import { fetchProfile } from '@/lib/redux/slices/profileSlice';
import type { RootState } from '@/lib/redux/store';
import {
  mapActivitiesToDaily,
  mapActivitiesToWeekly,
  mapActivitiesToMonthly,
  mapActivitiesToYearly,
  type DailyActivity,
  type TimeRangeData,
  getTodayDate,
} from '@/utils';
import { ExerciseDetailChart } from './components/exercise-detail-chart';
import { ExerciseMetricCard } from './components/exercise-metric-card';
import { ExerciseAnalyticsSkeleton } from './components/exercise-analytics-skeleton';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

type MetricType = 'steps' | 'calories' | 'distance' | 'duration' | 'mets';

export default function ExercisesPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('steps');
  const currentDate = useMemo(() => new Date(), []);
  const { address } = useAppKitAccount();
  const addressLower = useMemo(() => address?.toLowerCase(), [address]);

  const dispatch = useAppDispatch();

  const { activities, isLoading, error } = useAppSelector((state: RootState) => state.activityData);
  const { goals } = useAppSelector((state: RootState) => state.goals);
  const { profile } = useAppSelector((state: RootState) => state.profile);

  // Memoize derived data
  const dailyActivity: DailyActivity | null = useMemo(() => {
    if (activities.length > 0) {
      return mapActivitiesToDaily(activities, currentDate);
    }
    return null;
  }, [activities, currentDate]);

  const weeklyChartData: TimeRangeData[] = useMemo(() => {
    return mapActivitiesToWeekly(activities, currentDate);
  }, [activities, currentDate]);

  const monthlyChartData: TimeRangeData[] = useMemo(() => {
    return mapActivitiesToMonthly(activities, currentDate);
  }, [activities, currentDate]);

  const yearlyChartData: TimeRangeData[] = useMemo(() => {
    return mapActivitiesToYearly(activities, currentDate);
  }, [activities, currentDate]);

  // Calculate metrics summaries
  const metricsData = useMemo(() => {
    const weeklyTotals = weeklyChartData.reduce(
      (acc, item) => ({
        steps: acc.steps + item.steps,
        calories: acc.calories + item.calories,
        distance: acc.distance + item.distance,
        duration: acc.duration + item.duration,
        mets: acc.mets + item.mets,
      }),
      { steps: 0, calories: 0, distance: 0, duration: 0, mets: 0 },
    );

    const monthlyTotals = monthlyChartData.reduce(
      (acc, item) => ({
        steps: acc.steps + item.steps,
        calories: acc.calories + item.calories,
        distance: acc.distance + item.distance,
        duration: acc.duration + item.duration,
        mets: acc.mets + item.mets,
      }),
      { steps: 0, calories: 0, distance: 0, duration: 0, mets: 0 },
    );

    const yearlyTotals = yearlyChartData.reduce(
      (acc, item) => ({
        steps: acc.steps + item.steps,
        calories: acc.calories + item.calories,
        distance: acc.distance + item.distance,
        duration: acc.duration + item.duration,
        mets: acc.mets + item.mets,
      }),
      { steps: 0, calories: 0, distance: 0, duration: 0, mets: 0 },
    );

    return {
      daily: dailyActivity || { steps: 0, calories: 0, distance: 0, activeMinutes: 0, mets: 0 },
      weekly: weeklyTotals,
      monthly: monthlyTotals,
      yearly: yearlyTotals,
    };
  }, [dailyActivity, weeklyChartData, monthlyChartData, yearlyChartData]);

  // Get goals for metrics
  const getGoalForMetric = (metric: MetricType) => {
    const goalTypeMap: Record<MetricType, string> = {
      steps: 'steps',
      calories: 'calories_burned',
      distance: 'distance',
      duration: 'duration',
      mets: 'mets',
    };
    return goals.find((goal) => goal.goalType === goalTypeMap[metric] && goal.category === 'daily');
  };

  const handleRefresh = async () => {
    if (!addressLower) return;

    setRefreshing(true);
    try {
      await dispatch(fetchActivities(addressLower)).unwrap();
      await dispatch(fetchGoals(addressLower)).unwrap();
      await dispatch(fetchProfile(addressLower)).unwrap();
    } catch (error) {
      console.error('Refresh failed:', error);
    }
    setRefreshing(false);
  };

  useEffect(() => {
    if (addressLower) {
      handleRefresh();
    }
  }, [addressLower]);

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please connect your wallet to view analytics</h1>
        </div>
      </div>
    );
  }

  if (isLoading && !refreshing) {
    return <ExerciseAnalyticsSkeleton />;
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8 space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>
          <RefreshButton
            onRefresh={handleRefresh}
            isLoading={isLoading || refreshing}
          />
        </div>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500/20 p-2 rounded-full">
            <BarChart3 className="h-6 w-6 text-blue-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Exercise Analytics</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Detailed insights into your activity metrics and performance
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div variants={item}>
          <ErrorAlert message={error} />
        </motion.div>
      )}

      {/* Metric Cards */}
      <motion.div variants={item}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ExerciseMetricCard
            icon={<Activity className="h-5 w-5" />}
            title="Steps"
            value={metricsData.daily.steps}
            unit=""
            goal={getGoalForMetric('steps')?.targetValue}
            isSelected={selectedMetric === 'steps'}
            onClick={() => setSelectedMetric('steps')}
            color="blue"
          />
          <ExerciseMetricCard
            icon={<Flame className="h-5 w-5" />}
            title="Calories"
            value={metricsData.daily.calories}
            unit="kcal"
            goal={getGoalForMetric('calories')?.targetValue}
            isSelected={selectedMetric === 'calories'}
            onClick={() => setSelectedMetric('calories')}
            color="orange"
          />
          <ExerciseMetricCard
            icon={<TrendingUp className="h-5 w-5" />}
            title="Distance"
            value={metricsData.daily.distance}
            unit="km"
            goal={getGoalForMetric('distance')?.targetValue}
            isSelected={selectedMetric === 'distance'}
            onClick={() => setSelectedMetric('distance')}
            color="green"
          />
          <ExerciseMetricCard
            icon={<Clock className="h-5 w-5" />}
            title="Duration"
            value={metricsData.daily.activeMinutes}
            unit="min"
            goal={getGoalForMetric('duration')?.targetValue}
            isSelected={selectedMetric === 'duration'}
            onClick={() => setSelectedMetric('duration')}
            color="purple"
          />
          <ExerciseMetricCard
            icon={<Target className="h-5 w-5" />}
            title="METs"
            value={metricsData.daily.mets}
            unit=""
            goal={getGoalForMetric('mets')?.targetValue}
            isSelected={selectedMetric === 'mets'}
            onClick={() => setSelectedMetric('mets')}
            color="pink"
          />
        </div>
      </motion.div>

      {/* Detailed Chart */}
      <motion.div variants={item}>
        <ExerciseDetailChart
          metric={selectedMetric}
          weeklyData={weeklyChartData}
          monthlyData={monthlyChartData}
          yearlyData={yearlyChartData}
          isLoading={isLoading || refreshing}
        />
      </motion.div>

      {/* Summary Statistics */}
      <motion.div variants={item}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedMetric === 'steps' && metricsData.daily.steps.toLocaleString()}
                {selectedMetric === 'calories' && metricsData.daily.calories.toLocaleString()}
                {selectedMetric === 'distance' && metricsData.daily.distance.toFixed(1)}
                {selectedMetric === 'duration' && Math.round(metricsData.daily.activeMinutes)}
                {selectedMetric === 'mets' && metricsData.daily.mets}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedMetric === 'steps' && 'steps'}
                {selectedMetric === 'calories' && 'kcal burned'}
                {selectedMetric === 'distance' && 'km covered'}
                {selectedMetric === 'duration' && 'minutes active'}
                {selectedMetric === 'mets' && 'METs total'}
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedMetric === 'steps' && metricsData.weekly.steps.toLocaleString()}
                {selectedMetric === 'calories' && metricsData.weekly.calories.toLocaleString()}
                {selectedMetric === 'distance' && metricsData.weekly.distance.toFixed(1)}
                {selectedMetric === 'duration' && Math.round(metricsData.weekly.duration)}
                {selectedMetric === 'mets' && metricsData.weekly.mets}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedMetric === 'steps' && 'steps total'}
                {selectedMetric === 'calories' && 'kcal burned'}
                {selectedMetric === 'distance' && 'km covered'}
                {selectedMetric === 'duration' && 'minutes active'}
                {selectedMetric === 'mets' && 'METs total'}
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                This Month
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedMetric === 'steps' && metricsData.monthly.steps.toLocaleString()}
                {selectedMetric === 'calories' && metricsData.monthly.calories.toLocaleString()}
                {selectedMetric === 'distance' && metricsData.monthly.distance.toFixed(1)}
                {selectedMetric === 'duration' && Math.round(metricsData.monthly.duration)}
                {selectedMetric === 'mets' && metricsData.monthly.mets}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedMetric === 'steps' && 'steps total'}
                {selectedMetric === 'calories' && 'kcal burned'}
                {selectedMetric === 'distance' && 'km covered'}
                {selectedMetric === 'duration' && 'minutes active'}
                {selectedMetric === 'mets' && 'METs total'}
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                This Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {selectedMetric === 'steps' && metricsData.yearly.steps.toLocaleString()}
                {selectedMetric === 'calories' && metricsData.yearly.calories.toLocaleString()}
                {selectedMetric === 'distance' && metricsData.yearly.distance.toFixed(1)}
                {selectedMetric === 'duration' && Math.round(metricsData.yearly.duration)}
                {selectedMetric === 'mets' && metricsData.yearly.mets}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {selectedMetric === 'steps' && 'steps total'}
                {selectedMetric === 'calories' && 'kcal burned'}
                {selectedMetric === 'distance' && 'km covered'}
                {selectedMetric === 'duration' && 'minutes active'}
                {selectedMetric === 'mets' && 'METs total'}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}