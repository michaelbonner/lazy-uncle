import {
  extendType,
  nonNull,
  stringArg,
  intArg,
  booleanArg,
  list,
} from "nexus";

export const Mutation = extendType({
  type: "Mutation",
  definition(t) {
    t.field("createBirthday", {
      type: "Birthday",
      args: {
        name: nonNull(stringArg()),
        date: nonNull(stringArg()),
        category: stringArg(),
        parent: stringArg(),
        notes: stringArg(),
        userId: nonNull(stringArg()),
        importSource: stringArg(),
      },
      resolve: (
        _,
        { name, date, category, parent, notes, userId, importSource },
        ctx,
      ) => {
        return ctx.prisma.birthday.create({
          data: {
            name,
            date,
            category,
            parent,
            notes,
            userId,
            importSource: importSource || "manual",
            createdAt: new Date(),
          },
        });
      },
    });

    t.field("editBirthday", {
      type: "Birthday",
      args: {
        id: nonNull(stringArg()),
        name: nonNull(stringArg()),
        date: nonNull(stringArg()),
        category: stringArg(),
        parent: stringArg(),
        notes: stringArg(),
        importSource: stringArg(),
      },
      resolve: (
        _,
        { id, name, date, category, parent, notes, importSource },
        ctx,
      ) => {
        return ctx.prisma.birthday.update({
          where: {
            id: id,
          },
          data: {
            name,
            date,
            category,
            parent,
            notes,
            importSource,
          },
        });
      },
    });

    t.field("deleteBirthday", {
      type: "Birthday",
      args: {
        birthdayId: nonNull(stringArg()),
      },
      resolve: (_, { birthdayId }, ctx) => {
        return ctx.prisma.birthday.delete({
          where: { id: birthdayId || "" },
        });
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
        const { SecurityMiddleware } = await import(
          "../../lib/security-middleware"
        );

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
        date: nonNull(stringArg()),
        category: stringArg(),
        notes: stringArg(),
        submitterName: stringArg(),
        submitterEmail: stringArg(),
        relationship: stringArg(),
      },
      resolve: async (_, args, ctx) => {
        const { SubmissionService } = await import(
          "../../lib/submission-service"
        );
        const { SecurityMiddleware } = await import(
          "../../lib/security-middleware"
        );

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
            date: args.date,
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
          date: args.date,
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
        const submission = await ctx.prisma.birthdaySubmission.findUnique({
          where: { id: result.submissionId },
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
        const { notificationService } = await import(
          "../../lib/notification-service"
        );

        const preferences: any = {};
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
        return ctx.prisma.notificationPreference.findUnique({
          where: { userId: ctx.user.id },
        });
      },
    });

    t.field("importSubmission", {
      type: "Birthday",
      args: {
        submissionId: nonNull(stringArg()),
      },
      resolve: async (_, { submissionId }, ctx) => {
        const { SubmissionService } = await import(
          "../../lib/submission-service"
        );

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
        return ctx.prisma.birthday.findUnique({
          where: { id: result.birthdayId },
        });
      },
    });

    t.field("rejectSubmission", {
      type: "BirthdaySubmission",
      args: {
        submissionId: nonNull(stringArg()),
      },
      resolve: async (_, { submissionId }, ctx) => {
        const { SubmissionService } = await import(
          "../../lib/submission-service"
        );

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
        return ctx.prisma.birthdaySubmission.findUnique({
          where: { id: submissionId },
        });
      },
    });

    t.field("bulkImportSubmissions", {
      type: "BulkSubmissionResult",
      args: {
        submissionIds: nonNull(list(nonNull(stringArg()))),
      },
      resolve: async (_, { submissionIds }, ctx) => {
        const { SubmissionService } = await import(
          "../../lib/submission-service"
        );

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
        const { SubmissionService } = await import(
          "../../lib/submission-service"
        );

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
        const { SubmissionService } = await import(
          "../../lib/submission-service"
        );

        // Get the submission first
        const submission = await ctx.prisma.birthdaySubmission.findFirst({
          where: {
            id: submissionId,
            sharingLink: {
              userId: ctx.user.id,
            },
          },
        });

        if (!submission) {
          throw new Error("Submission not found");
        }

        const result = await SubmissionService.detectDuplicates(ctx.user.id, {
          name: submission.name,
          date: submission.date,
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
