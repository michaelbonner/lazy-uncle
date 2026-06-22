import { sharingLinks } from "../../drizzle/schema";
import { SecurityMiddleware } from "../../lib/security-middleware";
import { SharingService } from "../../lib/sharing-service";
import { protectedProcedure, publicProcedure, router } from "../trpc";
import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

export const sharingRouter = router({
  // Active sharing links for the current user, with submission counts.
  list: protectedProcedure.query(async ({ ctx }) => {
    const links = await ctx.db.query.sharingLinks.findMany({
      where: and(
        eq(sharingLinks.userId, ctx.user.id),
        eq(sharingLinks.isActive, true),
      ),
      with: { submissions: { columns: { id: true } } },
      orderBy: [desc(sharingLinks.createdAt)],
    });

    return links.map((link) => ({
      ...link,
      submissionCount: link.submissions.length,
    }));
  }),

  create: protectedProcedure
    .input(
      z.object({
        description: z.string().nullish(),
        category: z.string().nullish(),
        expirationHours: z.number().nullish(),
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
        userId: ctx.user.id,
      };

      const securityResult =
        await SecurityMiddleware.checkSharingLinkRateLimit(securityContext);

      if (!securityResult.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: securityResult.reason || "Request blocked by security policy",
        });
      }

      const link = await SharingService.createSharingLink({
        userId: ctx.user.id,
        expirationHours: input.expirationHours || undefined,
        description: input.description || undefined,
        category: input.category || undefined,
      });

      return { ...link, submissionCount: 0 };
    }),

  revoke: protectedProcedure
    .input(z.object({ linkId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await SharingService.revokeSharingLink(
        input.linkId,
        ctx.user.id,
      );
      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Sharing link not found or not owned by user",
        });
      }
      return result;
    }),

  // Public: validate a sharing link by token (used on the public /share page).
  validate: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input, ctx }) => {
      const sharingLink = await ctx.db.query.sharingLinks.findFirst({
        where: eq(sharingLinks.token, input.token),
        with: { user: { columns: { name: true } } },
      });

      if (!sharingLink) {
        return {
          isValid: false as const,
          error: "INVALID_TOKEN",
          message: "This sharing link is not valid.",
          sharingLink: null,
        };
      }

      if (!sharingLink.isActive) {
        return {
          isValid: false as const,
          error: "INACTIVE_LINK",
          message: "This sharing link has been deactivated.",
          sharingLink: null,
        };
      }

      if (sharingLink.expiresAt <= new Date()) {
        // Automatically deactivate expired links
        await ctx.db
          .update(sharingLinks)
          .set({ isActive: false })
          .where(eq(sharingLinks.id, sharingLink.id));

        return {
          isValid: false as const,
          error: "EXPIRED_LINK",
          message: "This sharing link has expired.",
          sharingLink: null,
        };
      }

      return {
        isValid: true as const,
        error: null,
        message: null,
        sharingLink: {
          id: sharingLink.id,
          token: sharingLink.token,
          description: sharingLink.description,
          expiresAt: sharingLink.expiresAt,
          ownerName: sharingLink.user.name,
        },
      };
    }),
});
