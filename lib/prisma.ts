/* eslint-disable no-unused-vars */
import { PrismaClient } from "@prisma/client";
import { PrismaClientOptions } from "@prisma/client/runtime";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient<PrismaClientOptions>;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
