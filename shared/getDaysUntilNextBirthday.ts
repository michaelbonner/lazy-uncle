import {
  addYears,
  differenceInDays,
  format,
  isFuture,
  isToday,
  parse,
  startOfDay,
} from "date-fns";
import { NexusGenObjects } from "../generated/nexus-typegen";
import getDateFromYmdString from "./getDateFromYmdString";

export const getDaysUntilNextBirthday = (
  birthday: NexusGenObjects["Birthday"]
): number => {
  const birthDate = getDateFromYmdString(birthday.date || "");
  const birthDateMonthAndDay = format(birthDate, "MM-dd");
  const thisYearBirthday = parse(birthDateMonthAndDay, "MM-dd", new Date());

  const nextBirthday =
    isFuture(thisYearBirthday) || isToday(thisYearBirthday)
      ? thisYearBirthday
      : addYears(thisYearBirthday, 1);

  const daysFromNow = differenceInDays(nextBirthday, startOfDay(new Date()));

  return daysFromNow;
};
