import { birthdays, birthdaySubmissions, sharingLinks } from "../../drizzle/schema";
import { SecurityMiddleware } from "../../lib/security-middleware";
import { SubmissionService } from "../../lib/submission-service";
import { formatBirthdayDate, withBirthdayDate } from "../format";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";

const MAX_BULK_SUBMISSIONS = 100;

export const submissionRouter = router({
  // Paginated pending submissions across the current user's sharing links.
  pending: protectedProcedure
    .input(
      z
        .object({
          page: z.number().int().min(1).default(1),
          limit: z.number().int().min(1).max(100).default(10),
        })
        .default({ page: 1, limit: 10 }),
    )
    .query(async ({ input, ctx }) => {
      const { page, limit } = input;
      const skip = (page - 1) * limit;

      const userSharingLinks = await ctx.db.query.sharingLinks.findMany({
        where: eq(sharingLinks.userId, ctx.user.id),
        columns: { id: true },
      });
      const sharingLinkIds = userSharingLinks.map((link) => link.id);

      if (sharingLinkIds.length === 0) {
        return {
          submissions: [],
          totalCount: 0,
          hasNextPage: false,
          hasPreviousPage: false,
          currentPage: page,
          totalPages: 0,
        };
      }

      const where = and(
        eq(birthdaySubmissions.status, "PENDING"),
        inArray(birthdaySubmissions.sharingLinkId, sharingLinkIds),
      );
      const [countRow] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(birthdaySubmissions)
        .where(where);
      const totalCount = countRow?.count ?? 0;

      const paginatedSubmissions = await ctx.db.query.birthdaySubmissions.findMany({
        where,
        with: {
          sharingLink: { columns: { id: true, description: true } },
        },
        orderBy: [desc(birthdaySubmissions.createdAt)],
        limit,
        offset: skip,
      });

      return {
        submissions: paginatedSubmissions.map(withBirthdayDate),
        totalCount,
        hasNextPage: skip + limit < totalCount,
        hasPreviousPage: page > 1,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
      };
    }),

  // Public: submit a birthday via a sharing link token.
  submit: publicProcedure
    .input(
      z.object({
        token: z.string(),
        name: z.string(),
        year: z.number().nullish(),
        month: z.number(),
        day: z.number(),
        notes: z.string().nullish(),
        submitterName: z.string().nullish(),
        submitterEmail: z.string().nullish(),
        relationship: z.string().nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const securityContext = {
        ipAddress:
          (ctx.req?.headers?.["x-forwarded-for"] as string)?.split(",")[0] ||
          (ctx.req?.headers?.["x-real-ip"] as string) ||
          ctx.req?.connection?.remoteAddress ||
          "unknown",
        userAgent: ctx.req?.headers?.["user-agent"] as string | undefined,
        token: input.token,
      };

      const securityResult = await SecurityMiddleware.checkSubmissionSecurity(
        securityContext,
        {
          name: input.name,
          year: input.year ?? null,
          month: input.month,
          day: input.day,
          submitterEmail: input.submitterEmail || undefined,
        },
      );

      if (!securityResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: securityResult.reason || "Request blocked by security policy",
        });
      }

      const result = await SubmissionService.processSubmission(input.token, {
        name: input.name,
        year: input.year ?? null,
        month: input.month,
        day: input.day,
        notes: input.notes || undefined,
        submitterName: input.submitterName || undefined,
        submitterEmail: input.submitterEmail || undefined,
        relationship: input.relationship || undefined,
      });

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors?.join(", ") || "Failed to submit birthday",
        });
      }

      const submission = await ctx.db.query.birthdaySubmissions.findFirst({
        where: eq(birthdaySubmissions.id, result.submissionId!),
      });

      if (!submission) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to retrieve created submission",
        });
      }

      return withBirthdayDate(submission);
    }),

  import: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await SubmissionService.importSubmission(
        input.submissionId,
        ctx.user.id,
      );

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors?.join(", ") || "Failed to import submission",
        });
      }

      const birthday = await ctx.db.query.birthdays.findFirst({
        where: eq(birthdays.id, result.birthdayId!),
      });

      return birthday ? withBirthdayDate(birthday) : null;
    }),

  reject: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await SubmissionService.rejectSubmission(
        input.submissionId,
        ctx.user.id,
      );

      if (!result.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: result.errors?.join(", ") || "Failed to reject submission",
        });
      }

      const submission = await ctx.db.query.birthdaySubmissions.findFirst({
        where: eq(birthdaySubmissions.id, input.submissionId),
      });

      return submission ? withBirthdayDate(submission) : null;
    }),

  bulkImport: protectedProcedure
    .input(
      z.object({
        submissionIds: z.array(z.string()).max(MAX_BULK_SUBMISSIONS),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const result = await SubmissionService.bulkImportSubmissions(
        input.submissionIds,
        ctx.user.id,
      );

      return {
        success: result.success,
        processedCount: result.imported,
        failedCount: result.failed.length,
        failedIds: result.failed,
        errors: result.errors || [],
      };
    }),

  bulkReject: protectedProcedure
    .input(
      z.object({
        submissionIds: z.array(z.string()).max(MAX_BULK_SUBMISSIONS),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const result = await SubmissionService.bulkRejectSubmissions(
        input.submissionIds,
        ctx.user.id,
      );

      return {
        success: result.success,
        processedCount: result.rejected,
        failedCount: result.failed.length,
        failedIds: result.failed,
        errors: result.errors || [],
      };
    }),

  duplicates: protectedProcedure
    .input(z.object({ submissionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const submission = await ctx.db.query.birthdaySubmissions.findFirst({
        where: eq(birthdaySubmissions.id, input.submissionId),
        with: { sharingLink: true },
      });

      if (!submission || submission.sharingLink.userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Submission not found" });
      }

      const result = await SubmissionService.detectDuplicates(ctx.user.id, {
        name: submission.name,
        year: submission.year ?? null,
        month: submission.month,
        day: submission.day,
        notes: submission.notes || undefined,
        submitterName: submission.submitterName || undefined,
        submitterEmail: submission.submitterEmail || undefined,
        relationship: submission.relationship || undefined,
      });

      return {
        hasDuplicates: result.hasDuplicates,
        matches: result.matches.map((match) => ({
          ...match,
          date: formatBirthdayDate(match.year, match.month, match.day),
        })),
      };
    }),
});
