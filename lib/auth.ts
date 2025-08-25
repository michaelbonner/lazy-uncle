import { PrismaClient } from "@prisma/client";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const getURL = () => {
  const url =
    (process.env.NEXT_PUBLIC_EXPORT == "true"
      ? process.env.NEXT_PUBLIC_BASE_URL // Set this to production URL in all envs. (For output: "export")
      : process.env.NEXT_PUBLIC_SITE_URL || // Set this to your site URL in production env only. (Production)
        process.env.NEXT_PUBLIC_VERCEL_URL) || // Automatically set by Vercel. (Preview)
    "http://localhost:3000"; // Default to localhost. (Development)

  // Make sure to include `https://` when not localhost.
  return url.includes("http") ? url : `https://${url}`;
};

const prisma = new PrismaClient();
export const auth = betterAuth({
  trustedOrigins: [getURL()],
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
});
