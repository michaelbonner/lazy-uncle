import {
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
} from "date-fns";

export default function getAgeForHumans(
  birthday: Date,
  alwaysShow: boolean = false,
): string {
  // weeks for infants
  if (differenceInMonths(new Date(), birthday) < 6) {
    return `${differenceInWeeks(new Date(), birthday)} weeks`;
  }

  // months for older infants/toddlers
  if (differenceInYears(new Date(), birthday) < 2) {
    return `${differenceInMonths(new Date(), birthday)} months`;
  }

  // don't show age for 30 or older people
  if (!alwaysShow && differenceInYears(new Date(), birthday) > 29) {
    return `30+`;
  }

  // default to years
  return differenceInYears(new Date(), birthday).toString();
}
