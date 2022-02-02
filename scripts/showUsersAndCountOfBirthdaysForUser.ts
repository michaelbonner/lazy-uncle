// npx ts-node --compiler-options {\"module\":\"CommonJS\"} scripts/showUsersAndCountOfBirthdaysForUser

import { Birthday, PrismaClient, User } from "@prisma/client";
import prisma from "../lib/prisma";

declare global {
  // eslint-disable-next-line no-unused-vars
  var prisma: PrismaClient;
}

async function main() {
  const users = await prisma.user.findMany({
    orderBy: [
      {
        name: "asc",
      },
    ],
    include: {
      birthdays: true,
    },
  });

  users.map(
    async (
      user: User & {
        birthdays: Birthday[];
      }
    ) => {
      console.log(`${user.name} - ${user.email}`);
      console.log(` - Birthdays: ${user.birthdays.length}`);
    }
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
