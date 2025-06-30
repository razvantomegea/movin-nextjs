/**
 * Checks if a date string (YYYY-MM-DD) is today.
 * @param dateStr The date string to check
 * @returns true if the date is today, false otherwise
 */
export function isToday(dateStr: string): boolean {
  if (!dateStr) return false;
  const today = new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate();
}

/**
 * Checks if a date string (YYYY-MM-DD) matches today's month and day.
 * @param dateStr The date string to check
 * @returns true if the month and day match today, false otherwise
 */
export function isTodayMonthDay(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const today = new Date();
    const [year, month, day] = dateStr.split('-').map(Number);

    // Validate basic date parts
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return false;
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    return month === today.getMonth() + 1 && day === today.getDate();
  } catch (error) {
    console.error("Error in isTodayMonthDay:", error);
    return false;
  }
}
