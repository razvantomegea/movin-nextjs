import { IActivity } from '@/lib/supabase/activities';

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
  id: number;
  type: string;
  duration: string;
  distance: string;
  calories: number;
  time: string;
}

export const mapActivitiesToDaily = (activities: IActivity[], date: Date): DailyActivity => {
  const targetDateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const dailyActivities = activities.filter(
    (activity) =>
      new Date(activity.start_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }) === targetDateStr,
  );

  return dailyActivities.reduce<DailyActivity>(
    (acc, activity) => {
      acc.steps += activity.total_steps || 0;
      acc.distance += (activity.total_distance || 0) / 1000;
      acc.calories += activity.total_energy_burned || 0;
      acc.activeMinutes += (activity.duration || 0) / 60;
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
    day.setDate(currentDate.getDate() - currentDate.getDay() + i); // Adjust to start of week (Sunday) then add offset
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
  const numWeeks = Math.ceil(new Date(year, month + 1, 0).getDate() / 7);

  for (let i = 0; i < numWeeks; i++) {
    let weeklySteps = 0;
    let weeklyDistance = 0;
    let weeklyCalories = 0;
    let weeklyDuration = 0;

    for (let j = 0; j < 7; j++) {
      const day = new Date(year, month, i * 7 + j + 1);
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
  const targetDateStr = currentDate.toLocaleDateString('en-US');
  return activities
    .filter(
      (activity) => new Date(activity.start_date).toLocaleDateString('en-US') === targetDateStr,
    )
    .map((activity) => ({
      id: parseInt(activity.id, 10),
      type: activity.name || 'Workout',
      duration: `${Math.round((activity.duration || 0) / 60)} min`,
      distance: activity.total_distance
        ? `${((activity.total_distance || 0) / 1000).toFixed(1)} km`
        : '',
      calories: activity.total_energy_burned || 0,
      time: new Date(activity.start_date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    }));
};
