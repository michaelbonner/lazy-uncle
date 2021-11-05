import { PrismaClient } from "@prisma/client";
import { getServerSession, NextAuthOptions, User } from "next-auth";
import prisma from "../lib/prisma";

export type Context = {
  user: User | null;
  accessToken: string;
  prisma: PrismaClient;
};
export async function createContext({ req, res }): Promise<Context> {
  const { user } = await getServerSession({ req, res }, {} as NextAuthOptions);
  return {
    user: user as User,
    accessToken: "",
    prisma,
  };
}
