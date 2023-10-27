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
    { encoding: "utf-8" },
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
      notes: row[4] !== "NULL" ? row[4] : null,
    };
  }) as Birthday[];
}

async function main() {
  // load csv
  if (argv.length < 3) {
    console.log("Please provide the user's email as argument");
    return;
  }
  const csvBirthdays = await loadCsvBirthdays();

  // load user from email provided
  const email = argv[2];
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
    include: {
      birthdays: true,
    },
  });

  if (!user) {
    console.log(`User with email ${email} not found`);
    return;
  }

  const birthdaysToAdd = csvBirthdays
    .filter((csvBirthday: Birthday) => {
      return user.birthdays.find((userBirthday) => {
        return (
          userBirthday.name === csvBirthday.name &&
          userBirthday.date === csvBirthday.date
        );
      })
        ? false
        : true;
    })
    .map((csvBirthday: Birthday) => {
      return {
        ...csvBirthday,
        userId: user.id,
      } as Birthday;
    });

  if (!birthdaysToAdd.length) {
    console.log("No birthdays to add");
    return;
  }
  await prisma.birthday.createMany({ data: birthdaysToAdd });

  console.log(`Added ${birthdaysToAdd.length} birthday(s) for user ${email}`);
  birthdaysToAdd.map((birthdayToAdd) =>
    console.log(` - added ${birthdayToAdd.name}`),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
