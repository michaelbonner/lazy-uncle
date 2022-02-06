import { PrismaClient } from "@prisma/client";
import { getSession } from "next-auth/react";
import { NexusGenObjects } from "../generated/nexus-typegen";
import { prisma } from "../lib/prisma";

export type Context = {
  prisma: PrismaClient;
  user: NexusGenObjects["User"];
};

export async function createContext({ req }): Promise<Context> {
  const session = await getSession({ req });

  // if the user is not logged in, omit returning the user and accessToken
  if (!session) return { prisma, user: null };

  const { user } = session;

  return {
    user,
    prisma,
  };
}
