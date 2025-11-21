// npx tsx scripts/showUsersAndCountOfBirthdaysForUser
import { users } from "../drizzle/schema";
import db from "../lib/db";
import { asc } from "drizzle-orm";

async function main() {
  const userList = await db.query.users.findMany({
    orderBy: [asc(users.name)],
    with: {
      birthdays: true,
    },
  });

  userList.forEach((user) => {
    console.log(`${user.name} - ${user.email}`);
    console.log(` - Birthdays: ${user.birthdays.length}`);
  });
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
