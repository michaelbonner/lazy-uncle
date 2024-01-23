import { PrismaClient } from "@prisma/client";
import { IncomingMessage, ServerResponse } from "http";
import { getServerSession } from "next-auth";
import { NexusGenObjects } from "../generated/nexus-typegen";
import prisma from "../lib/prisma";
import { authOptions } from "../pages/api/auth/[...nextauth]";

export type Context = {
  prisma: PrismaClient;
  user: NexusGenObjects["User"];
};

export async function createContext({
  req,
  res,
}: {
  req: IncomingMessage & { cookies: { [key: string]: string } };
  res: ServerResponse<IncomingMessage>;
}): Promise<Context> {
  const session = await getServerSession(req, res, authOptions);

  // if the user is not logged in, omit returning the user
  if (!session) return { prisma, user: {} };

  const { user } = session;

  return {
    user,
    prisma,
  };
}
