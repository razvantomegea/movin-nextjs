/**
 * Time-related utility functions for charts
 */

/**
 * Filters data based on the selected time range
 * @param data Array of data points to filter
 * @param timeRange The selected time range ('week', 'month', or 'year')
 * @returns Filtered data array
 */
export function filterDataByTimeRange(data: any[], timeRange: 'week' | 'month' | 'year') {
  const now = new Date();
  if (timeRange === 'week') {
    const todayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    return data.slice(0, todayIndex + 1);
  }
  if (timeRange === 'month') {
    const todayDate = now.getDate();
    return data.slice(0, todayDate);
  }
  if (timeRange === 'year') {
    const currentMonth = now.getMonth();
    return data.slice(0, currentMonth + 1);
  }
  return data;
}

/**
 * Get tick values for charts based on time range
 * @param timeRange The selected time range ('week', 'month', or 'year')
 * @returns Array of tick values
 */
export function getTickValues(timeRange: 'week' | 'month' | 'year') {
  const now = new Date();
  if (timeRange === 'week') {
    // Always start from Monday
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const todayIndex = now.getDay() === 0 ? 6 : now.getDay() - 1;
    return days.slice(0, todayIndex + 1);
  }
  if (timeRange === 'month') {
    return Array.from({ length: now.getDate() }, (_, i) => (i + 1).toString());
  }
  if (timeRange === 'year') {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    return months.slice(0, now.getMonth() + 1);
  }
  return [];
}

/**
 * Format tick values for chart axes
 * @param param0 Object containing tick value and context
 * @returns Formatted tick value
 */
export function formatTick({
  value,
  index,
  allTicks,
  timeRange,
}: {
  value: string;
  index: number;
  allTicks: string[];
  timeRange?: 'week' | 'month' | 'year';
}) {
  const now = new Date();
  const currentValue = value;

  // Get current time period values
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const currentDay = days[now.getDay()];
  const currentDate = now.getDate().toString();
  const currentMonth = months[now.getMonth()];

  // Handle special case for the last element
  if (index === allTicks.length - 1) {
    if (timeRange === 'week' && value !== currentDay) return currentDay;
    if (timeRange === 'month' && value !== currentDate) return currentDate;
    if (timeRange === 'year' && value !== currentMonth) return currentMonth;
  }

  // For other elements, check if we've already reached or passed the current period
  if (timeRange === 'week') {
    const dayIndex = days.indexOf(value);
    const currentDayIndex = now.getDay();
    if (dayIndex > currentDayIndex) return '';
  } else if (timeRange === 'month') {
    const date = parseInt(value, 10);
    const currentDateNum = now.getDate();
    if (date > currentDateNum) return '';
  } else if (timeRange === 'year') {
    const monthIndex = months.indexOf(value);
    const currentMonthIndex = now.getMonth();
    if (monthIndex > currentMonthIndex) return '';
  }

  return currentValue;
}
