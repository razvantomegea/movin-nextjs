import { IActivity } from '@/lib/supabase/activities';

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);

  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export interface DailyActivity {
  steps: number;
  distance: number;
  calories: number;
  activeMinutes: number;
  date: string;
}

export interface TimeRangeData {
  label: string;
  steps: number;
  distance: number;
  calories: number;
  duration: number;
}

export interface Workout {
  id: string;
  type: string;
  duration: string;
  rawDuration: number;
  distance: string;
  rawDistance?: number;
  calories: number;
  time: string;
}

export const mapActivitiesToDaily = (activities: IActivity[], date: Date): DailyActivity => {
  const targetDateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Then use it in the filter function
  const dailyActivities = activities.filter((activity) => isSameDay(activity.start_date, date));

  return dailyActivities.reduce<DailyActivity>(
    (acc, activity) => {
      acc.steps += activity?.total_steps || 0;
      acc.distance += (activity?.total_distance || 0) / 1000;
      acc.calories += activity?.total_energy_burned || 0;
      acc.activeMinutes += (activity?.duration || 0) / 60;
      return acc;
    },
    {
      steps: 0,
      distance: 0,
      calories: 0,
      activeMinutes: 0,
      date: targetDateStr,
    },
  );
};

export const mapActivitiesToWeekly = (
  activities: IActivity[],
  currentDate: Date,
): TimeRangeData[] => {
  const weeklyData: TimeRangeData[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(currentDate);
    // Get first day of week based on locale
    const firstDayOfWeek = new Date(currentDate);
    const dayOfWeek = currentDate.getDay();
    const diff = currentDate.getDate() - dayOfWeek;
    firstDayOfWeek.setDate(diff);
    day.setDate(firstDayOfWeek.getDate() + i);
    const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
    const dailySummary = mapActivitiesToDaily(activities, day);
    weeklyData.push({
      label: dayStr,
      steps: dailySummary.steps,
      distance: dailySummary.distance,
      calories: dailySummary.calories,
      duration: Math.round(dailySummary.activeMinutes),
    });
  }
  return weeklyData;
};

export const mapActivitiesToMonthly = (
  activities: IActivity[],
  currentDate: Date,
): TimeRangeData[] => {
  const monthlyData: TimeRangeData[] = [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  // Get the last day of the month
  const lastDay = new Date(year, month + 1, 0);
  const firstDay = new Date(year, month, 1);
  // Calculate weeks by getting the difference in weeks between first and last day
  const firstWeek = Math.floor(firstDay.getDate() / 7);
  const lastWeek = Math.floor(lastDay.getDate() / 7);
  const numWeeks = lastWeek - firstWeek + 1;

  for (let i = 0; i < numWeeks; i++) {
    let weeklySteps = 0;
    let weeklyDistance = 0;
    let weeklyCalories = 0;
    let weeklyDuration = 0;

    for (let j = 0; j < 7; j++) {
      // Calculate the day more accurately based on week and day of week
      const firstDayOfMonth = new Date(year, month, 1);
      const firstDayOfWeek = firstDayOfMonth.getDay();
      const dayOfMonth = i * 7 + j + 1 - firstDayOfWeek;
      const day = new Date(year, month, dayOfMonth);
      if (day.getMonth() !== month) break; // Ensure we are still in the same month

      const dailySummary = mapActivitiesToDaily(activities, day);
      weeklySteps += dailySummary.steps;
      weeklyDistance += dailySummary.distance;
      weeklyCalories += dailySummary.calories;
      weeklyDuration += dailySummary.activeMinutes;
    }
    if (weeklySteps > 0 || weeklyDistance > 0 || weeklyCalories > 0 || weeklyDuration > 0) {
      monthlyData.push({
        label: `Week ${i + 1}`,
        steps: weeklySteps,
        distance: weeklyDistance,
        calories: weeklyCalories,
        duration: Math.round(weeklyDuration),
      });
    }
  }
  return monthlyData;
};

export const mapActivitiesToYearly = (
  activities: IActivity[],
  currentDate: Date,
): TimeRangeData[] => {
  const yearlyData: TimeRangeData[] = [];
  const year = currentDate.getFullYear();

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(year, i, 1);
    const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short' });
    const monthlyActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.start_date);
      return activityDate.getFullYear() === year && activityDate.getMonth() === i;
    });

    const monthlySummary = monthlyActivities.reduce(
      (acc, activity) => {
        acc.steps += activity.total_steps || 0;
        acc.distance += (activity.total_distance || 0) / 1000;
        acc.calories += activity.total_energy_burned || 0;
        acc.duration += (activity.duration || 0) / 60;
        return acc;
      },
      { steps: 0, distance: 0, calories: 0, duration: 0 },
    );

    yearlyData.push({
      label: monthStr,
      steps: monthlySummary.steps,
      distance: monthlySummary.distance,
      calories: monthlySummary.calories,
      duration: Math.round(monthlySummary.duration),
    });
  }
  return yearlyData;
};

export const mapActivitiesToTodaysWorkouts = (
  activities: IActivity[],
  currentDate: Date,
): Workout[] => {
  return activities
    .filter((activity) => isSameDay(activity.start_date, currentDate))
    .map((activity: IActivity) => ({
      id: activity.id,
      type: activity.name || 'Workout',
      duration: activity.duration != null ? `${Math.round(activity.duration / 60)} min` : '',
      rawDuration: activity.duration || 0,
      distance: activity.total_distance
        ? `${((activity.total_distance || 0) / 1000).toFixed(1)} km`
        : '',
      rawDistance: activity.total_distance || undefined,
      calories: activity.total_energy_burned || 0,
      time: new Date(activity.start_date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    }));
};
