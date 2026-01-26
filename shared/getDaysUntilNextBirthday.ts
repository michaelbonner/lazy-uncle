import {
  addYears,
  differenceInDays,
  isFuture,
  isToday,
  startOfDay,
} from "date-fns";
import { NexusGenObjects } from "../generated/nexus-typegen";

/**
 * Calculate days until next birthday from components
 * Works regardless of whether year is provided
 */
export function getDaysUntilNextBirthdayFromComponents(
  month: number,
  day: number,
): number {
  // Create birthday date for this year (year doesn't matter for calculation)
  const thisYearBirthday = new Date(
    new Date().getFullYear(),
    month - 1,
    day,
  );

  const nextBirthday =
    isFuture(thisYearBirthday) || isToday(thisYearBirthday)
      ? thisYearBirthday
      : addYears(thisYearBirthday, 1);

  const daysFromNow = differenceInDays(nextBirthday, startOfDay(new Date()));

  return daysFromNow;
}

export const getDaysUntilNextBirthday = (
  birthday: NexusGenObjects["Birthday"],
): number => {
  // Use components (all birthdays should have month and day after migration)
  if (birthday.month && birthday.day) {
    return getDaysUntilNextBirthdayFromComponents(birthday.month, birthday.day);
  }

  // Fallback: If no date information available, return 0
  return 0;
};
