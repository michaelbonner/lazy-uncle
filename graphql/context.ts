import { cookies } from "next/headers";
import { NexusGenObjects } from "../generated/nexus-typegen";
import { auth } from "../lib/auth";
import db from "../lib/db";

export type RequestLike = {
  headers?: Record<string, string | string[]>;
  connection?: { remoteAddress?: string };
};

export type Context = {
  db: typeof db;
  user?: NexusGenObjects["User"];
  req?: RequestLike;
};

export async function createContext(req?: RequestLike): Promise<Context> {
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: (await cookies()).toString(),
    }),
  });
  if (!session) return { db, req };
  // if the user is not logged in, omit returning the user
  if (!session) return { db, user: {}, req };

  const user = session?.user as NexusGenObjects["User"];

  return {
    user,
    db,
    req,
  };
}
