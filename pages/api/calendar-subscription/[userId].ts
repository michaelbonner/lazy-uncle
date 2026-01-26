import { birthdays } from "../../../drizzle/schema";
import db from "../../../lib/db";
import { getOrdinalNumber } from "../../../shared/getOrdinalNumber";
import { parse, setYear } from "date-fns";
import { eq } from "drizzle-orm";
import type { NextApiRequest, NextApiResponse } from "next";

interface Birthdate {
  title: string;
  start: [number, number, number];
  end: [number, number, number];
  busyStatus: "BUSY" | "FREE" | "TENTATIVE" | "OOF";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>,
) {
  const ics = await import("ics");

  const birthdayList = await db.query.birthdays.findMany({
    where: eq(birthdays.userId, req.query.userId as string),
  });

  const events = [] as Birthdate[];
  birthdayList.forEach((birthday) => {
    // Skip birthdays without month/day (shouldn't happen after migration)
    if (!birthday.month || !birthday.day) {
      return;
    }

    for (let index = -2; index < 3; index++) {
      const birthYear = birthday.year ?? 2000; // Use placeholder year if not provided
      const userBirthday = new Date(birthYear, birthday.month - 1, birthday.day);
      const birthDate = setYear(
        userBirthday,
        +new Date().getFullYear() + index,
      );
      const age = birthday.year ? (birthDate.getFullYear() - birthday.year) : null;
      if (age !== null && age < 0) {
        continue;
      }
      events.push({
        title: `${birthday.name}'s${
          age !== null && age > 30 || age === null || age < 1 ? "" : ` ${getOrdinalNumber(age)}`
        } Birthday`,
        start: [
          birthDate.getFullYear(),
          birthDate.getMonth() + 1,
          birthDate.getDate(),
        ],
        end: [
          birthDate.getFullYear(),
          birthDate.getMonth() + 1,
          birthDate.getDate(),
        ],
        busyStatus: "FREE",
      });
    }
  });

  const { error, value } = ics.createEvents(events);

  // 1 hour
  const secondsToCache = 60 * 60;
  // 1 day
  const secondsToReturnStaleWhileRevalidate = 60 * 60 * 24;
  res.setHeader(
    "Cache-Control",
    `public, s-maxage=${secondsToCache}, stale-while-revalidate=${secondsToReturnStaleWhileRevalidate}`,
  );

  if (error) {
    res.status(400).send(error.toString());
  }

  res.status(200).send(value || "");
}
