// npx ts-node --compiler-options {\"module\":\"CommonJS\"} scripts/addBirthdaysForUser.ts
import type { NewBirthday } from "../drizzle/schema";
import { birthdays, users } from "../drizzle/schema";
import db from "../lib/db";
import { faker } from "@faker-js/faker";
import { createId } from "@paralleldrive/cuid2";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { argv } from "process";
import readline from "readline";

interface CsvBirthday {
  name: string;
  date: string;
  category: string | null;
  parent: string | null;
  notes: string | null;
}

async function loadCsvBirthdays(): Promise<CsvBirthday[]> {
  const filePath = path.resolve(__dirname, "../data/birthdays.csv");
  if (!fs.existsSync(filePath)) {
    console.log("CSV file not found, returning empty list");
    return [];
  }

  const data = fs.readFileSync(filePath, { encoding: "utf-8" });
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

async function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function generateSeededBirthdays(count: number): Promise<CsvBirthday[]> {
  const categories = ["Family", "Friend", "Colleague", "Acquaintance", null];
  const now = new Date();
  const seventyYearsAgo = new Date(
    now.getFullYear() - 70,
    now.getMonth(),
    now.getDate(),
  );

  const seededBirthdays: CsvBirthday[] = [];

  for (let i = 0; i < count; i++) {
    // Use faker to generate a realistic name
    const name = faker.person.fullName();

    // Generate random date between 70 years ago and now
    const randomTime =
      seventyYearsAgo.getTime() +
      Math.random() * (now.getTime() - seventyYearsAgo.getTime());
    const randomDate = new Date(randomTime);

    // Format as YYYY-MM-DD
    const month = String(randomDate.getMonth() + 1).padStart(2, "0");
    const day = String(randomDate.getDate()).padStart(2, "0");
    const year = randomDate.getFullYear();
    const date = `${year}-${month}-${day}`;

    const category = categories[Math.floor(Math.random() * categories.length)];

    seededBirthdays.push({
      name,
      date,
      category,
      parent: null,
      notes: null,
    });
  }

  return seededBirthdays;
}

async function main() {
  // load csv
  if (argv.length < 3) {
    console.log("Please provide the user's email as argument");
    return;
  }
  let csvBirthdays = await loadCsvBirthdays();

  let importSource = "csv-seeder";

  // Check if CSV is empty and prompt for seeded data
  if (csvBirthdays.length === 0) {
    importSource = "random-seeder";
    const answer = await promptUser(
      "No birthdays found in CSV. Would you like to add 100 seeded birthdays? (yes/no): ",
    );

    if (answer === "yes" || answer === "y") {
      console.log("Generating 100 seeded birthdays...");
      csvBirthdays = await generateSeededBirthdays(100);
      console.log("Seeded birthdays generated!");
    } else {
      console.log("No birthdays to add");
      return;
    }
  }

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
        importSource,
        createdAt: new Date(),
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
