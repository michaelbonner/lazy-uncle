export default function getZodiacSignForDateYmdString(date: string): string {
  if (!date) {
    return "";
  }

  const month = date.split("-")[1];
  const day = date.split("-")[2];
  const monthDay = +`${month}${day}`;

  if (monthDay <= 119) {
    return "Capricorn";
  }
  if (monthDay <= 219) {
    return "Aquarius";
  }
  if (monthDay <= 320) {
    return "Pisces";
  }
  // mar 21 = apr 20
  if (monthDay <= 420) {
    return "Aries";
  }
  // apr 21 = may 20
  if (monthDay <= 520) {
    return "Taurus";
  }
  // may 21 = jun 20
  if (monthDay <= 620) {
    return "Gemini";
  }
  // jun 21 = jul 22
  if (monthDay <= 722) {
    return "Cancer";
  }
  // jul 23 = aug 22
  if (monthDay <= 822) {
    return "Leo";
  }
  // aug 23 = sep 22
  if (monthDay <= 922) {
    return "Virgo";
  }
  // sep 23 = oct 22
  if (monthDay <= 1022) {
    return "Libra";
  }
  // oct 23 = nov 22
  if (monthDay <= 1122) {
    return "Scorpio";
  }
  // nov 23 = dec 21
  if (monthDay <= 1221) {
    return "Sagittarius";
  }

  return "Capricorn";
}
