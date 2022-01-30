import type { NextApiRequest, NextApiResponse } from "next";
import { parse, setYear } from "date-fns";
import prisma from "../../../lib/prisma";

const ics = require("ics");

interface Birthdate {
  title: string;
  start: [number, number, number];
  end: [number, number, number];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<string>
) {
  const birthdays = await prisma.birthday.findMany({
    where: {
      userId: req.query.userId as string,
    },
  });

  const events = [] as Birthdate[];
  birthdays.forEach((birthday) => {
    for (let index = 0; index < 100; index++) {
      const userBirthday = parse(birthday.date, "yyyy-MM-dd", new Date());
      const birthDate = setYear(
        userBirthday,
        +new Date().getFullYear() + index
      );
      events.push({
        title: `${birthday.name}'s Birthday`,
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
      });
    }
  });

  const { error, value } = ics.createEvents(events);

  if (error) {
    res.status(400).send(error.toString());
  }

  res.status(200).send(value || "");
}
