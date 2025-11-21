// npx ts-node --compiler-options {\"module\":\"CommonJS\"} scripts/addBirthdaysForUser.ts
import type { NewBirthday } from "../drizzle/schema";
import { birthdays, users } from "../drizzle/schema";
import db from "../lib/db";
import { createId } from "@paralleldrive/cuid2";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { argv } from "process";

interface CsvBirthday {
  name: string;
  date: string;
  category: string | null;
  parent: string | null;
  notes: string | null;
}

async function loadCsvBirthdays(): Promise<CsvBirthday[]> {
  const data = fs.readFileSync(
    path.resolve(__dirname, "../data/birthdays.csv"),
    { encoding: "utf-8" },
  );
  if (!data) {
    console.log("No data found in csv file");
    return [];
  }
  const parsedData = parse(data);
  return parsedData.map((row: string[]) => {
    return {
      name: row[0],
      date: row[1],
      category: row[2] !== "NULL" ? row[2] : null,
      parent: row[3] !== "NULL" ? row[3] : null,
      notes: row[4] !== "NULL" ? row[4] : null,
    };
  });
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
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      birthdays: true,
    },
  });

  if (!user) {
    console.log(`User with email ${email} not found`);
    return;
  }

  const birthdaysToAdd = csvBirthdays
    .filter((csvBirthday: CsvBirthday) => {
      return !user.birthdays.find((userBirthday) => {
        return (
          userBirthday.name === csvBirthday.name &&
          userBirthday.date === csvBirthday.date
        );
      });
    })
    .map((csvBirthday: CsvBirthday): NewBirthday => {
      return {
        id: createId(),
        name: csvBirthday.name,
        date: csvBirthday.date,
        category: csvBirthday.category || null,
        parent: csvBirthday.parent || null,
        notes: csvBirthday.notes || null,
        userId: user.id,
      };
    });

  if (!birthdaysToAdd.length) {
    console.log("No birthdays to add");
    return;
  }

  // Insert birthdays one by one (Drizzle doesn't have createMany with relations)
  for (const birthday of birthdaysToAdd) {
    await db.insert(birthdays).values(birthday);
  }

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
    // Drizzle handles connection pooling, no explicit disconnect needed
    process.exit(0);
  });
