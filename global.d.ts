import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./drizzle/schema";

declare global {
  var drizzleDb: ReturnType<typeof drizzle<typeof schema>>;
}
