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

function toFetchHeaders(req?: RequestLike): Headers {
  const headers = new Headers();
  if (!req?.headers) return headers;
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) headers.append(key, v);
    } else if (typeof value === "string") {
      headers.set(key, value);
    }
  }
  return headers;
}

export async function createContext(req?: RequestLike): Promise<Context> {
  const session = await auth.api.getSession({
    headers: toFetchHeaders(req),
  });

  if (!session) return { db, req };

  const user = session.user as NexusGenObjects["User"];

  return {
    user,
    db,
    req,
  };
}
