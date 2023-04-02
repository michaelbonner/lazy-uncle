import { PrismaAdapter } from "@next-auth/prisma-adapter";
import NextAuth, { Session, User } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import prisma from "../../../lib/prisma";

export const authOptions = {
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID || "",
      clientSecret: process.env.GITHUB_SECRET || "",
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async session({ session, user }: { session: Session; user: User }) {
      session.user = user;
      return session;
    },
  },
  events: {
    async createUser({ user }: { user: User }) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          createdAt: new Date(),
        },
      });
    },
  },
};

export default NextAuth(authOptions);
