import {
  birthdays,
  birthdaySubmissions,
  NotificationPreference,
  notificationPreferences,
} from "../../drizzle/schema";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import {
  booleanArg,
  extendType,
  intArg,
  list,
  nonNull,
  stringArg,
} from "nexus";

export const Mutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createBirthday", {
      type: "Birthday",
      args: {
        name: nonNull(stringArg()),
        // NEW: Date components (year is optional)
        year: intArg(),
        month: nonNull(intArg()),
        day: nonNull(intArg()),
        category: stringArg(),
        parent: stringArg(),
        notes: stringArg(),
        userId: nonNull(stringArg()),
        importSource: stringArg(),
      },
      resolve: async (
        _,
        {
          name,
          year,
          month,
          day,
          category,
          parent,
          notes,
          userId,
          importSource,
        },
        ctx,
      ) => {
        // Validate date components
        const { InputValidator } = await import("../../lib/input-validator");

        const monthValidation = InputValidator.validateMonth(month);
        if (!monthValidation.isValid) {
          throw new Error("Invalid month: must be between 1 and 12");
        }

        const dayValidation = InputValidator.validateDay(
          day,
          month,
          year ?? null,
        );
        if (!dayValidation.isValid) {
          throw new Error("Invalid day for the given month");
        }

        if (year !== null && year !== undefined) {
          const yearValidation = InputValidator.validateYear(year);
          if (!yearValidation.isValid) {
            throw new Error("Invalid year: must be between 1900 and next year");
          }
        }

        const [birthday] = await ctx.db
          .insert(birthdays)
          .values({
            id: createId(),
            name,
            year: year ?? null,
            month,
            day,
            category: category || null,
            parent: parent || null,
            notes: notes || null,
            userId,
            importSource: importSource || "manual",
            createdAt: new Date(),
          })
          .returning();
        return birthday;
      },
    });

    t.field("editBirthday", {
      type: "Birthday",
      args: {
        id: nonNull(stringArg()),
        name: nonNull(stringArg()),
        // NEW: Date components (year is optional)
        year: intArg(),
        month: nonNull(intArg()),
        day: nonNull(intArg()),
        category: stringArg(),
        parent: stringArg(),
        notes: stringArg(),
        importSource: stringArg(),
      },
      resolve: async (
        _,
        { id, name, year, month, day, category, parent, notes, importSource },
        ctx,
      ) => {
        // Validate date components
        const { InputValidator } = await import("../../lib/input-validator");

        const monthValidation = InputValidator.validateMonth(month);
        if (!monthValidation.isValid) {
          throw new Error("Invalid month: must be between 1 and 12");
        }

        const dayValidation = InputValidator.validateDay(
          day,
          month,
          year ?? null,
        );
        if (!dayValidation.isValid) {
          throw new Error("Invalid day for the given month");
        }

        if (year !== null && year !== undefined) {
          const yearValidation = InputValidator.validateYear(year);
          if (!yearValidation.isValid) {
            throw new Error("Invalid year: must be between 1900 and next year");
          }
        }

        const [birthday] = await ctx.db
          .update(birthdays)
          .set({
            name,
            year: year ?? null,
            month,
            day,
            category: category || null,
            parent: parent || null,
            notes: notes || null,
            importSource: importSource || null,
          })
          .where(and(eq(birthdays.id, id), eq(birthdays.userId, ctx.user.id)))
          .returning();
        if (!birthday) {
          throw new Error("Birthday not found or unauthorized");
        }
        return birthday;
      },
    });

    t.field("deleteBirthday", {
      type: "Birthday",
      args: {
        birthdayId: nonNull(stringArg()),
      },
      resolve: async (_, { birthdayId }, ctx) => {
        const [birthday] = await ctx.db
          .delete(birthdays)
          .where(
            and(
              eq(birthdays.id, birthdayId || ""),
              eq(birthdays.userId, ctx.user.id),
            ),
          )
          .returning();
        if (!birthday) {
          throw new Error("Birthday not found or unauthorized");
        }
        return birthday;
      },
    });

    t.field("createSharingLink", {
      type: "SharingLink",
      args: {
        description: stringArg(),
        expirationHours: intArg(),
      },
      resolve: async (_, { description, expirationHours }, ctx) => {
        const { SharingService } = await import("../../lib/sharing-service");
        const { SecurityMiddleware } =
          await import("../../lib/security-middleware");

        // Extract security context from the request
        // Note: In a real implementation, we'd need to pass the request object through context
        const securityContext = {
          ipAddress:
            ctx.req?.headers?.["x-forwarded-for"]?.split(",")[0] ||
            ctx.req?.headers?.["x-real-ip"] ||
            ctx.req?.connection?.remoteAddress ||
            "unknown",
          userAgent: ctx.req?.headers?.["user-agent"],
          userId: ctx.user.id,
        };

        // Check security and rate limits
        const securityResult =
          await SecurityMiddleware.checkSharingLinkRateLimit(securityContext);

        if (!securityResult.allowed) {
          throw new Error(
            securityResult.reason || "Request blocked by security policy",
          );
        }

        return SharingService.createSharingLink({
          userId: ctx.user.id,
          expirationHours: expirationHours || undefined,
          description: description || undefined,
        });
      },
    });

    t.field("revokeSharingLink", {
      type: "SharingLink",
      args: {
        linkId: nonNull(stringArg()),
      },
      resolve: async (_, { linkId }, ctx) => {
        const { SharingService } = await import("../../lib/sharing-service");

        const result = await SharingService.revokeSharingLink(
          linkId,
          ctx.user.id,
        );
        if (!result) {
          throw new Error("Sharing link not found or not owned by user");
        }
        return result;
      },
    });

    t.field("submitBirthday", {
      type: "BirthdaySubmission",
      args: {
        token: nonNull(stringArg()),
        name: nonNull(stringArg()),
        // NEW: Date components (year is optional)
        year: intArg(),
        month: nonNull(intArg()),
        day: nonNull(intArg()),
        category: stringArg(),
        notes: stringArg(),
        submitterName: stringArg(),
        submitterEmail: stringArg(),
        relationship: stringArg(),
      },
      resolve: async (_, args, ctx) => {
        const { SubmissionService } =
          await import("../../lib/submission-service");
        const { SecurityMiddleware } =
          await import("../../lib/security-middleware");

        // Extract security context from the request
        const securityContext = {
          ipAddress:
            ctx.req?.headers?.["x-forwarded-for"]?.split(",")[0] ||
            ctx.req?.headers?.["x-real-ip"] ||
            ctx.req?.connection?.remoteAddress ||
            "unknown",
          userAgent: ctx.req?.headers?.["user-agent"],
          token: args.token,
        };

        // Check security and rate limits
        const securityResult = await SecurityMiddleware.checkSubmissionSecurity(
          securityContext,
          {
            name: args.name,
            year: args.year ?? null,
            month: args.month,
            day: args.day,
            submitterEmail: args.submitterEmail || undefined,
          },
        );

        if (!securityResult.allowed) {
          throw new Error(
            securityResult.reason || "Request blocked by security policy",
          );
        }

        const result = await SubmissionService.processSubmission(args.token, {
          name: args.name,
          year: args.year ?? null,
          month: args.month,
          day: args.day,
          category: args.category || undefined,
          notes: args.notes || undefined,
          submitterName: args.submitterName || undefined,
          submitterEmail: args.submitterEmail || undefined,
          relationship: args.relationship || undefined,
        });

        if (!result.success) {
          throw new Error(
            result.errors?.join(", ") || "Failed to submit birthday",
          );
        }

        // Return the created submission
        const submission = await ctx.db.query.birthdaySubmissions.findFirst({
          where: eq(birthdaySubmissions.id, result.submissionId!),
        });

        if (!submission) {
          throw new Error("Failed to retrieve created submission");
        }

        return submission;
      },
    });

    t.field("updateNotificationPreferences", {
      type: "NotificationPreference",
      args: {
        emailNotifications: booleanArg(),
        summaryNotifications: booleanArg(),
      },
      resolve: async (_, { emailNotifications, summaryNotifications }, ctx) => {
        const { notificationService } =
          await import("../../lib/notification-service");

        const preferences: Partial<NotificationPreference> = {};
        if (emailNotifications !== null && emailNotifications !== undefined) {
          preferences.emailNotifications = emailNotifications;
        }
        if (
          summaryNotifications !== null &&
          summaryNotifications !== undefined
        ) {
          preferences.summaryNotifications = summaryNotifications;
        }

        await notificationService.updateNotificationPreferences(
          ctx.user.id,
          preferences,
        );

        // Return the updated preferences
        return ctx.db.query.notificationPreferences.findFirst({
          where: eq(notificationPreferences.userId, ctx.user.id),
        });
      },
    });

    t.field("importSubmission", {
      type: "Birthday",
      args: {
        submissionId: nonNull(stringArg()),
      },
      resolve: async (_, { submissionId }, ctx) => {
        const { SubmissionService } =
          await import("../../lib/submission-service");

        const result = await SubmissionService.importSubmission(
          submissionId,
          ctx.user.id,
        );

        if (!result.success) {
          throw new Error(
            result.errors?.join(", ") || "Failed to import submission",
          );
        }

        // Return the created birthday
        return ctx.db.query.birthdays.findFirst({
          where: eq(birthdays.id, result.birthdayId!),
        });
      },
    });

    t.field("rejectSubmission", {
      type: "BirthdaySubmission",
      args: {
        submissionId: nonNull(stringArg()),
      },
      resolve: async (_, { submissionId }, ctx) => {
        const { SubmissionService } =
          await import("../../lib/submission-service");

        const result = await SubmissionService.rejectSubmission(
          submissionId,
          ctx.user.id,
        );

        if (!result.success) {
          throw new Error(
            result.errors?.join(", ") || "Failed to reject submission",
          );
        }

        // Return the updated submission
        return ctx.db.query.birthdaySubmissions.findFirst({
          where: eq(birthdaySubmissions.id, submissionId),
        });
      },
    });

    t.field("bulkImportSubmissions", {
      type: "BulkSubmissionResult",
      args: {
        submissionIds: nonNull(list(nonNull(stringArg()))),
      },
      resolve: async (_, { submissionIds }, ctx) => {
        const { SubmissionService } =
          await import("../../lib/submission-service");

        const result = await SubmissionService.bulkImportSubmissions(
          submissionIds,
          ctx.user.id,
        );

        return {
          success: result.success,
          processedCount: result.imported,
          failedCount: result.failed.length,
          failedIds: result.failed,
          errors: result.errors || [],
        };
      },
    });

    t.field("bulkRejectSubmissions", {
      type: "BulkSubmissionResult",
      args: {
        submissionIds: nonNull(list(nonNull(stringArg()))),
      },
      resolve: async (_, { submissionIds }, ctx) => {
        const { SubmissionService } =
          await import("../../lib/submission-service");

        const result = await SubmissionService.bulkRejectSubmissions(
          submissionIds,
          ctx.user.id,
        );

        return {
          success: result.success,
          processedCount: result.rejected,
          failedCount: result.failed.length,
          failedIds: result.failed,
          errors: result.errors || [],
        };
      },
    });

    t.field("getSubmissionDuplicates", {
      type: "DuplicateDetectionResult",
      args: {
        submissionId: nonNull(stringArg()),
      },
      resolve: async (_, { submissionId }, ctx) => {
        const { SubmissionService } =
          await import("../../lib/submission-service");

        // Get the submission first
        const submission = await ctx.db.query.birthdaySubmissions.findFirst({
          where: eq(birthdaySubmissions.id, submissionId),
          with: {
            sharingLink: true,
          },
        });

        if (!submission || submission.sharingLink.userId !== ctx.user.id) {
          throw new Error("Submission not found");
        }

        const result = await SubmissionService.detectDuplicates(ctx.user.id, {
          name: submission.name,
          year: submission.year ?? null,
          month: submission.month,
          day: submission.day,
          category: submission.category || undefined,
          notes: submission.notes || undefined,
          submitterName: submission.submitterName || undefined,
          submitterEmail: submission.submitterEmail || undefined,
          relationship: submission.relationship || undefined,
        });

        return result;
      },
    });
  },
});
