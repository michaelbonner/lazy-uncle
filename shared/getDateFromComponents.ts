/**
 * Create a Date object from year/month/day components
 * If year is null, uses a placeholder year (current year or arbitrary year for calculations)
 */
export function getDateFromComponents(
  year: number | null,
  month: number,
  day: number,
  useCurrentYear = false,
): Date {
  // If no year provided, use current year or placeholder
  const effectiveYear =
    year ?? (useCurrentYear ? new Date().getFullYear() : 2000);

  // Create Date object (month is 0-indexed in JS Date)
  return new Date(effectiveYear, month - 1, day);
}

/**
 * Format date components to YYYY-MM-DD string
 */
export function formatDateComponents(
  year: number | null,
  month: number,
  day: number,
): string {
  const monthStr = month.toString().padStart(2, "0");
  const dayStr = day.toString().padStart(2, "0");

  if (year) {
    const yearStr = year.toString().padStart(4, "0");
    return `${yearStr}-${monthStr}-${dayStr}`;
  }

  // Partial date format (ISO 8601)
  return `--${monthStr}-${dayStr}`;
}

/**
 * Format date for display (e.g., "March 15" or "March 15, 1990")
 */
export function formatDateForDisplay(
  year: number | null,
  month: number,
  day: number,
): string {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthName = monthNames[month - 1];

  if (year) {
    return `${monthName} ${day}, ${year}`;
  }

  return `${monthName} ${day}`;
}
