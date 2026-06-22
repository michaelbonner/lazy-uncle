import {
  notificationPreferences,
  type NotificationPreference,
} from "../../drizzle/schema";
import { notificationService } from "../../lib/notification-service";
import { protectedProcedure, router } from "../trpc";
import { eq } from "drizzle-orm";
import { z } from "zod";

export const notificationRouter = router({
  preferences: protectedProcedure.query(async ({ ctx }) => {
    return (
      (await ctx.db.query.notificationPreferences.findFirst({
        where: eq(notificationPreferences.userId, ctx.user.id),
      })) ?? null
    );
  }),

  update: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean().nullish(),
        summaryNotifications: z.boolean().nullish(),
        birthdayReminders: z.boolean().nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const preferences: Partial<NotificationPreference> = {};
      if (input.emailNotifications !== null && input.emailNotifications !== undefined) {
        preferences.emailNotifications = input.emailNotifications;
      }
      if (input.summaryNotifications !== null && input.summaryNotifications !== undefined) {
        preferences.summaryNotifications = input.summaryNotifications;
      }
      if (input.birthdayReminders !== null && input.birthdayReminders !== undefined) {
        preferences.birthdayReminders = input.birthdayReminders;
      }

      await notificationService.updateNotificationPreferences(
        ctx.user.id,
        preferences,
      );

      return (
        (await ctx.db.query.notificationPreferences.findFirst({
          where: eq(notificationPreferences.userId, ctx.user.id),
        })) ?? null
      );
    }),
});
