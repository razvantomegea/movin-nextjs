import { IActivity } from '@/lib/supabase/activities';
import { formatDistance } from './formatDistance';
import { formatDuration } from './formatDuration';
import { calculateMetsFromCalories } from './calculateMets';

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

/**
 * Checks if a new activity overlaps with any existing activities.
 * @param newActivity The new activity (must have start_date and end_date)
 * @param existingActivities Array of existing activities
 * @returns The overlapping activity if found, otherwise null
 */
export function doesActivityOverlap(
  newActivity: { start_date: string; end_date: string; id?: string },
  existingActivities: Array<{ start_date: string; end_date: string; id?: string }>,
): { start_date: string; end_date: string; id?: string } | null {
  const newStart = new Date(newActivity.start_date).getTime();
  const newEnd = new Date(newActivity.end_date).getTime();

  for (const act of existingActivities) {
    // Skip self if editing
    if (newActivity.id && act.id && newActivity.id === act.id) continue;
    const actStart = new Date(act.start_date).getTime();
    const actEnd = new Date(act.end_date).getTime();
    // Overlap if intervals intersect
    if (newStart < actEnd && newEnd > actStart) {
      return act;
    }
  }
  return null;
}

export interface DailyActivity {
  steps: number;
  distance: number;
  calories: number;
  mets: number;
  activeMinutes: number;
  date: string;
}

export interface TimeRangeData {
  label: string;
  steps: number;
  distance: number;
  calories: number;
  mets: number;
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

  let calories = 0;
  let mets = 0;
  let steps = 0;
  let distance = 0;
  let activeMinutes = 0;

  dailyActivities.forEach((activity) => {
    steps += activity?.total_steps || 0;
    distance += (activity?.total_distance || 0) / 1000;
    calories += activity?.total_energy_burned || 0;
    activeMinutes += (activity?.duration || 0) / 60;
    mets += calculateMetsFromCalories(activity?.total_energy_burned || 0);
  });

  return {
    steps,
    distance,
    calories,
    mets,
    activeMinutes,
    date: targetDateStr,
  };
};

export const mapActivitiesToWeekly = (
  activities: IActivity[],
  currentDate: Date,
): TimeRangeData[] => {
  const weeklyData: TimeRangeData[] = [];
  // Calculate the date of the first day of the week (Monday)
  const firstDayOfWeek = new Date(currentDate);
  const day = currentDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const diff = day === 0 ? 6 : day - 1; // Adjust to make Monday the first day
  firstDayOfWeek.setDate(currentDate.getDate() - diff);

  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek);
    day.setDate(firstDayOfWeek.getDate() + i);
    const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
    const dailySummary = mapActivitiesToDaily(activities, day);
    weeklyData.push({
      label: dayStr,
      steps: dailySummary.steps,
      distance: dailySummary.distance,
      calories: dailySummary.calories,
      mets: dailySummary.mets,
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
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dailySummary = mapActivitiesToDaily(activities, date);

    // Only add data if there was activity on that day
    if (
      dailySummary.steps > 0 ||
      dailySummary.distance > 0 ||
      dailySummary.calories > 0 ||
      dailySummary.activeMinutes > 0
    ) {
      monthlyData.push({
        label: day.toString(), // Use the day of the month as the label
        steps: dailySummary.steps,
        distance: dailySummary.distance,
        calories: dailySummary.calories,
        mets: dailySummary.mets,
        duration: Math.round(dailySummary.activeMinutes),
      });
    } else {
      // Optionally, push an entry with zero values if you want all days to be present in the chart
      monthlyData.push({
        label: day.toString(),
        steps: 0,
        distance: 0,
        calories: 0,
        mets: 0,
        duration: 0,
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

    let steps = 0;
    let distance = 0;
    let calories = 0;
    let mets = 0;
    let duration = 0;
    monthlyActivities.forEach((activity) => {
      steps += activity.total_steps || 0;
      distance += (activity.total_distance || 0) / 1000;
      calories += activity.total_energy_burned || 0;
      mets += calculateMetsFromCalories(activity.total_energy_burned || 0);
      duration += (activity.duration || 0) / 60;
    });

    yearlyData.push({
      label: monthStr,
      steps,
      distance,
      calories,
      mets,
      duration: Math.round(duration),
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
      duration: formatDuration(activity.duration),
      rawDuration: activity.duration || 0,
      distance: formatDistance(activity.total_distance),
      rawDistance: activity.total_distance || undefined,
      calories: activity.total_energy_burned || 0,
      time: new Date(activity.start_date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    }));
};
