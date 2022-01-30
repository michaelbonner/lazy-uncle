import { differenceInYears } from "date-fns";

export default function getAgeInYears(birthday: Date): number {
  return differenceInYears(new Date(), birthday);
}
