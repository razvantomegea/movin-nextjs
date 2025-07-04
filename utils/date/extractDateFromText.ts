/**
 * Extracts a date (YYYY-MM-DD, YYYY_MM_DD, YYYYMMDD, or similar) from a string.
 * Returns the date in YYYY-MM-DD format if found, otherwise null.
 * @param text The input string to search for a date
 */
export function extractDateFromText(text: string): string | null {
  // Match YYYY-MM-DD, YYYY_MM_DD, YYYYMMDD, or similar
  const regex = /(20\d{2})[-_]?([01]\d)[-_]?([0-3]\d)/;
  const match = text.match(regex);
  if (match) {
    const year = match[1];
    const month = match[2];
    const day = match[3];
    // Basic validation
    if (Number(month) >= 1 && Number(month) <= 12 && Number(day) >= 1 && Number(day) <= 31) {
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}
