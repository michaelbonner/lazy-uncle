import { parseISO } from "date-fns";

export default function getZodiacSignForDateYmdString(date: string): string {
  const signs = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
  ];

  const parsedDate = parseISO(`${date}T04:00:00.000Z`);
  const formattedDate = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    month: "numeric",
  }).format(parsedDate);

  const sign = +formattedDate - 1;

  return signs[sign];
}
