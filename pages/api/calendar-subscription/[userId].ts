import { parse, setYear } from "date-fns";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../lib/prisma";
import { getOrdinalNumber } from "../../../shared/getOrdinalNumber";

interface Birthdate {
  title: string;
  start: [number, number, number];
  end: [number, number, number];
  busyStatus: "BUSY" | "FREE" | "TENTATIVE" | "OOF";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  const ics = require("ics");

  const birthdays = await prisma.birthday.findMany({
    where: {
      userId: req.query.userId as string,
    },
  });

  const events = [] as Birthdate[];
  birthdays.forEach((birthday) => {
    for (let index = -2; index < 3; index++) {
      const userBirthday = parse(birthday.date, "yyyy-MM-dd", new Date());
      const birthDate = setYear(
        userBirthday,
        +new Date().getFullYear() + index
      );
      const age = birthDate.getFullYear() - userBirthday.getFullYear();
      if (age < 0) {
        continue;
      }
      events.push({
        title: `${birthday.name}'s${
          age > 30 || age < 1 ? "" : ` ${getOrdinalNumber(age)}`
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
    `public, s-maxage=${secondsToCache}, stale-while-revalidate=${secondsToReturnStaleWhileRevalidate}`
  );

  if (error) {
    res.status(400).send(error.toString());
  }

  res.status(200).send(value || "");
}
