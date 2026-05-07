import * as schema from "../drizzle/schema";
import db from "./db";
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
          html: `<p>Click the link below to sign in to Lazy Uncle. This link expires in 5 minutes and can only be used once.</p>
<p><a href="${url}">Sign in to Lazy Uncle</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
          text: `Sign in to Lazy Uncle: ${url}\n\nThis link expires in 5 minutes and can only be used once. If you didn't request this, you can safely ignore this email.`,
        });
      },
    }),
  ],
});
