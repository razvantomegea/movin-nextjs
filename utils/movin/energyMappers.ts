import { IEnergy } from '@/lib/supabase/energy';

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

export interface DailyNutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
  mealsCount: number;
  date: string;
}

export interface NutritionTimeRangeData {
  label: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fats: number;
  fiber: number;
  mealsCount: number;
}

export interface TodaysMeal {
  id: string;
  name: string;
  time: string;
  calories: number;
  carbohydrates: number;
  fats: number;
  protein: number;
  fiber: number;
}

export const mapEnergyToDaily = (energyEntries: IEnergy[], date: Date): DailyNutrition => {
  const targetDateStr = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Filter entries for the specific date
  const dailyEntries = energyEntries.filter((entry) => isSameDay(entry.log_date, date));

  return dailyEntries.reduce<DailyNutrition>(
    (acc, entry) => {
      acc.calories += entry.calories || 0;
      acc.protein += entry.protein || 0;
      acc.carbohydrates += entry.carbohydrates || 0;
      acc.fats += entry.fats || 0;
      acc.fiber += entry.fiber || 0;
      acc.mealsCount += 1;
      return acc;
    },
    {
      calories: 0,
      protein: 0,
      carbohydrates: 0,
      fats: 0,
      fiber: 0,
      mealsCount: 0,
      date: targetDateStr,
    },
  );
};

export const mapEnergyToWeekly = (
  energyEntries: IEnergy[],
  currentDate: Date,
): NutritionTimeRangeData[] => {
  const weeklyData: NutritionTimeRangeData[] = [];
  // Calculate the date of the first day of the week (Monday)
  const firstDayOfWeek = new Date(currentDate);
  const day = currentDate.getDay(); // 0 is Sunday, 1 is Monday, etc.
  const diff = day === 0 ? 6 : day - 1; // Adjust to make Monday the first day
  firstDayOfWeek.setDate(currentDate.getDate() - diff);

  for (let i = 0; i < 7; i++) {
    const day = new Date(firstDayOfWeek);
    day.setDate(firstDayOfWeek.getDate() + i);
    const dayStr = day.toLocaleDateString('en-US', { weekday: 'short' });
    const dailySummary = mapEnergyToDaily(energyEntries, day);
    weeklyData.push({
      label: dayStr,
      calories: dailySummary.calories,
      protein: dailySummary.protein,
      carbohydrates: dailySummary.carbohydrates,
      fats: dailySummary.fats,
      fiber: dailySummary.fiber,
      mealsCount: dailySummary.mealsCount,
    });
  }
  return weeklyData;
};

export const mapEnergyToMonthly = (
  energyEntries: IEnergy[],
  currentDate: Date,
): NutritionTimeRangeData[] => {
  const monthlyData: NutritionTimeRangeData[] = [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dailySummary = mapEnergyToDaily(energyEntries, date);

    // Only add data if there was nutrition logged on that day
    if (
      dailySummary.calories > 0 ||
      dailySummary.protein > 0 ||
      dailySummary.carbohydrates > 0 ||
      dailySummary.fats > 0 ||
      dailySummary.fiber > 0
    ) {
      monthlyData.push({
        label: day.toString(), // Use the day of the month as the label
        calories: dailySummary.calories,
        protein: dailySummary.protein,
        carbohydrates: dailySummary.carbohydrates,
        fats: dailySummary.fats,
        fiber: dailySummary.fiber,
        mealsCount: dailySummary.mealsCount,
      });
    } else {
      // Optionally, push an entry with zero values if you want all days to be present in the chart
      monthlyData.push({
        label: day.toString(),
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fats: 0,
        fiber: 0,
        mealsCount: 0,
      });
    }
  }
  return monthlyData;
};

export const mapEnergyToYearly = (
  energyEntries: IEnergy[],
  currentDate: Date,
): NutritionTimeRangeData[] => {
  const yearlyData: NutritionTimeRangeData[] = [];
  const year = currentDate.getFullYear();

  for (let i = 0; i < 12; i++) {
    const monthDate = new Date(year, i, 1);
    const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short' });
    const monthlyEntries = energyEntries.filter((entry) => {
      const entryDate = new Date(entry.log_date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === i;
    });

    const monthlySummary = monthlyEntries.reduce(
      (acc, entry) => {
        acc.calories += entry.calories || 0;
        acc.protein += entry.protein || 0;
        acc.carbohydrates += entry.carbohydrates || 0;
        acc.fats += entry.fats || 0;
        acc.fiber += entry.fiber || 0;
        acc.mealsCount += 1;
        return acc;
      },
      { calories: 0, protein: 0, carbohydrates: 0, fats: 0, fiber: 0, mealsCount: 0 },
    );

    yearlyData.push({
      label: monthStr,
      calories: monthlySummary.calories,
      protein: monthlySummary.protein,
      carbohydrates: monthlySummary.carbohydrates,
      fats: monthlySummary.fats,
      fiber: monthlySummary.fiber,
      mealsCount: monthlySummary.mealsCount,
    });
  }
  return yearlyData;
};

export const mapEnergyToTodaysMeals = (
  energyEntries: IEnergy[],
  currentDate: Date,
): TodaysMeal[] => {
  return energyEntries
    .filter((entry) => isSameDay(entry.log_date, currentDate))
    .map((entry: IEnergy) => ({
      id: entry.id,
      name: entry.meal_name || 'Meal',
      time: new Date(entry.created_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      calories: entry.calories || 0,
      carbohydrates: entry.carbohydrates || 0,
      fats: entry.fats || 0,
      protein: entry.protein || 0,
      fiber: entry.fiber || 0,
    }));
};

// Helper function to get today's date as string
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};
