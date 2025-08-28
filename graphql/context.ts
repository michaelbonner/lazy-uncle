import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import { NexusGenObjects } from "../generated/nexus-typegen";
import { auth } from "../lib/auth";
import prisma from "../lib/prisma";

export type Context = {
  prisma: PrismaClient;
  user: NexusGenObjects["User"];
  req?: {
    headers?: Record<string, string | string[]>;
    connection?: { remoteAddress?: string };
  };
};

export async function createContext(req?: any): Promise<Context> {
  const session = await auth.api.getSession({
    headers: new Headers({
      cookie: (await cookies()).toString(),
    }),
  });

  // if the user is not logged in, omit returning the user
  if (!session) return { prisma, user: {}, req };

  const user = session?.user as NexusGenObjects["User"];

  return {
    user,
    prisma,
    req,
  };
}
