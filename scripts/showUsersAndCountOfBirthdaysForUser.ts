// npx ts-node --compiler-options {\"module\":\"CommonJS\"} scripts/showUsersAndCountOfBirthdaysForUser

import { PrismaClient, User } from "@prisma/client";
import prisma from "../lib/prisma";

declare global {
  // eslint-disable-next-line no-unused-vars
  var prisma: PrismaClient;
}

async function main() {
  const users = await prisma.user.findMany({});
  users.map(async (user: User) => {
    const userBirthdays = await prisma.birthday.findMany({
      where: { userId: user.id },
    });

    console.log(`${user.name} - ${user.email}`);
    console.log(` - Birthdays: ${userBirthdays.length}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
