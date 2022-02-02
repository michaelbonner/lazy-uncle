// npx ts-node --compiler-options {\"module\":\"CommonJS\"} scripts/addBirthdaysForUser.ts

import { Birthday, PrismaClient } from "@prisma/client";
import { parse } from "csv-parse/sync";
import fs from "fs";
import path from "path";
import { argv } from "process";
import prisma from "../lib/prisma";

declare global {
  // eslint-disable-next-line no-unused-vars
  var prisma: PrismaClient;
}

async function loadCsvBirthdays(): Promise<Birthday[]> {
  const data = fs.readFileSync(
    path.resolve(__dirname, "../data/birthdays.csv"),
    { encoding: "utf-8" }
  );
  if (!data) {
    console.log("No data found in csv file");
    return [];
  }
  const parsedData = await parse(data);
  return parsedData.map((row: any) => {
    return {
      name: row[0],
      date: row[1],
      category: row[2] !== "NULL" ? row[2] : null,
      parent: row[3] !== "NULL" ? row[3] : null,
    };
  }) as Birthday[];
}

async function main() {
  // load csv
  if (argv.length < 3) {
    console.log("Please provide the user id as argument");
    return;
  }
  const csvBirthdays = await loadCsvBirthdays();

  // load user from email provided
  const email = argv[2];
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    console.log(`User with email ${email} not found`);
    return;
  }

  // get birthdays user has already added
  const userBirthdays = await prisma.birthday.findMany({
    where: { userId: user.id },
  });

  // add new birthdays
  csvBirthdays.map(async (birthday: Birthday) => {
    const userBirthday = userBirthdays.find((userBirthday: Birthday) => {
      return (
        userBirthday.name === birthday.name &&
        userBirthday.date === birthday.date
      );
    });
    if (!userBirthday) {
      console.log(`Adding birthday ${birthday.name} for user ${user.name}`);
      await prisma.birthday.create({
        data: {
          name: birthday.name,
          date: birthday.date,
          category: birthday.category,
          parent: birthday.parent,
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });
    }
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
