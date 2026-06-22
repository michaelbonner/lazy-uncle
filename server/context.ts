import { auth } from "../lib/auth";
import db from "../lib/db";
import type { User } from "../drizzle/schema";

/**
 * A request-like shape that mirrors what the security middleware and services
 * expect (lowercased header map + connection.remoteAddress). Built from the
 * incoming fetch `Request` so the ported GraphQL security logic keeps working
 * unchanged.
 */
export type RequestLike = {
  headers?: Record<string, string | string[]>;
  connection?: { remoteAddress?: string };
};

export type Context = {
  db: typeof db;
  user?: User;
  req?: RequestLike;
};

function toRequestLike(request: Request): RequestLike {
  const headers = Object.fromEntries(request.headers.entries());
  return {
    headers,
    connection: {
      remoteAddress: request.headers.get("x-forwarded-for") || "unknown",
    },
  };
}

export async function createContext({
  req,
}: {
  req: Request;
}): Promise<Context> {
  const session = await auth.api.getSession({ headers: req.headers });
  const requestLike = toRequestLike(req);

  if (!session) {
    return { db, req: requestLike };
  }

  return {
    db,
    user: session.user as User,
    req: requestLike,
  };
}
