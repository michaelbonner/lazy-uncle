import * as schema from "../drizzle/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let dbInstance: ReturnType<typeof drizzle<typeof schema>>;

if (process.env.NODE_ENV === "production") {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  dbInstance = drizzle(pool, { schema });
} else {
  if (!global.drizzleDb) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    global.drizzleDb = drizzle(pool, { schema });
  }
  dbInstance = global.drizzleDb;
}

export default dbInstance;
export { schema };
