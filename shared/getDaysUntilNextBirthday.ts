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

  if(birthday.id === 'clkiijv1j0001l808vybsa6me') {
    console.log('birthday', birthday)
    console.log('thisYearBirthday', thisYearBirthday)
    console.log('isFuture(thisYearBirthday)', isFuture(thisYearBirthday))
    console.log('isToday(thisYearBirthday)', isToday(thisYearBirthday))
    console.log('addYears(thisYearBirthday, 1);', addYears(thisYearBirthday, 1))

    const nextBirthday =
    isFuture(thisYearBirthday) || isToday(thisYearBirthday)
      ? thisYearBirthday
      : addYears(thisYearBirthday, 1);
      
    console.log('nextBirthday', nextBirthday)
    const daysFromNow = differenceInDays(nextBirthday, startOfDay(new Date()));
    console.log('daysFromNow', daysFromNow)

  }

  const nextBirthday =
    isFuture(thisYearBirthday) || isToday(thisYearBirthday)
      ? thisYearBirthday
      : addYears(thisYearBirthday, 1);

  const daysFromNow = differenceInDays(nextBirthday, startOfDay(new Date()));

  return daysFromNow;
};
