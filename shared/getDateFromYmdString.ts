import { parse } from "date-fns";

export default function getDateFromYmdString(birthday: string): Date {
  if (!birthday) {
    return new Date();
  }
  return parse(birthday, "yyyy-MM-dd", new Date());
}
