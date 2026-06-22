/**
 * Reconstruct the deprecated `date` string from individual date components,
 * matching the behavior the GraphQL layer exposed on Birthday / BirthdaySubmission /
 * DuplicateMatch types:
 *   - full date  -> "YYYY-MM-DD"
 *   - no year    -> "--MM-DD" (ISO 8601 partial date)
 *   - incomplete -> null
 */
export function formatBirthdayDate(
  year: number | null | undefined,
  month: number | null | undefined,
  day: number | null | undefined,
): string | null {
  if (year && month && day) {
    const yearStr = year.toString().padStart(4, "0");
    const monthStr = month.toString().padStart(2, "0");
    const dayStr = day.toString().padStart(2, "0");
    return `${yearStr}-${monthStr}-${dayStr}`;
  }
  if (month && day) {
    const monthStr = month.toString().padStart(2, "0");
    const dayStr = day.toString().padStart(2, "0");
    return `--${monthStr}-${dayStr}`;
  }
  return null;
}

/** A Birthday row plus the derived `date` field. */
export function withBirthdayDate<
  T extends { year: number | null; month: number; day: number },
>(row: T): T & { date: string | null } {
  return { ...row, date: formatBirthdayDate(row.year, row.month, row.day) };
}
