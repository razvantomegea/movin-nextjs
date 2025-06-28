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
