import * as schema from "../drizzle/schema";
import db from "./db";
import { magicLinkEmail } from "./email-templates";
import { NotificationService } from "./notification-service";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";

const notificationService = new NotificationService();

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
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
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await notificationService.sendEmail({
          to: email,
          subject: "Your Lazy Uncle sign-in link",
          ...magicLinkEmail(url),
        });
      },
    }),
  ],
});
