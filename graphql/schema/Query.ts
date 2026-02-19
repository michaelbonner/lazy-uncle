import { and, desc, eq, inArray } from "drizzle-orm";
import { intArg, nonNull, objectType, queryType, stringArg } from "nexus";
import {
  birthdays,
  birthdaySubmissions,
  notificationPreferences,
  sharingLinks,
} from "../../drizzle/schema";

export const User = objectType({
  name: "User",
  definition(t) {
    t.string("id");
    t.string("name");
    t.string("email");
    t.list.field("birthdays", {
      type: "Birthday",
      resolve: async (parent, args, ctx) => {
        return ctx.db.query.birthdays.findMany({
          where: eq(birthdays.userId, parent.id || "6207fdc99b6c9796ff8e7d01"),
        });
      },
    });
  },
});

export const Birthday = objectType({
  name: "Birthday",
  definition(t) {
    t.string("id");
    t.string("name");

    // NEW: Expose individual date components
    t.nullable.int("year"); // Nullable for birthdays without year
    t.int("month"); // 1-12
    t.int("day"); // 1-31

    // DEPRECATED: Keep for backward compatibility during transition
    t.nullable.string("date", {
      resolve: (parent) => {
        // Reconstruct YYYY-MM-DD format for clients that still expect it
        if (parent.year && parent.month && parent.day) {
          const yearStr = parent.year.toString().padStart(4, "0");
          const monthStr = parent.month.toString().padStart(2, "0");
          const dayStr = parent.day.toString().padStart(2, "0");
          return `${yearStr}-${monthStr}-${dayStr}`;
        }
        // If no year, return --MM-DD format (ISO 8601 partial date)
        if (parent.month && parent.day) {
          const monthStr = parent.month.toString().padStart(2, "0");
          const dayStr = parent.day.toString().padStart(2, "0");
          return `--${monthStr}-${dayStr}`;
        }
        // If month or day is missing, return null
        return null;
      },
    });

    t.string("category");
    t.string("parent");
    t.string("notes");
    t.boolean("remindersEnabled");
    t.string("importSource");
    t.field("createdAt", {
      type: "DateTime",
    });
    t.nullable.field("user", {
      type: "User",
      resolve: async (parent, args, ctx) => {
        const birthday = await ctx.db.query.birthdays.findFirst({
          where: eq(birthdays.id, parent.id || ""),
          with: { user: true },
        });
        return birthday?.user ?? null;
      },
    });
  },
});

export const Query = queryType({
  definition(t) {
    t.field("birthday", {
      type: "Birthday",
      args: {
        birthdayId: nonNull(stringArg()),
      },
      resolve: async (_, args, ctx) => {
        const birthday = await ctx.db.query.birthdays.findFirst({
          where: eq(birthdays.id, args.birthdayId),
        });

        if (!birthday) {
          return null;
        }

        // don't show birthdays to other users
        if (birthday.userId !== ctx.user.id) {
          return null;
        }

        return birthday;
      },
    });

    t.list.field("birthdays", {
      type: "Birthday",
      resolve: async (_, args, ctx) => {
        return ctx.db.query.birthdays.findMany({
          where: eq(
            birthdays.userId,
            ctx.user.id || "6207fdc99b6c9796ff8e7d01",
          ),
        });
      },
    });

    t.list.field("users", {
      type: "User",
      resolve: async (_, args, ctx) => {
        return ctx.db.query.users.findMany();
      },
    });

    t.list.field("sharingLinks", {
      type: "SharingLink",
      resolve: async (_, args, ctx) => {
        return ctx.db.query.sharingLinks.findMany({
          where: and(
            eq(sharingLinks.userId, ctx.user.id),
            eq(sharingLinks.isActive, true),
          ),
          orderBy: [desc(sharingLinks.createdAt)],
        });
      },
    });

    t.field("pendingSubmissions", {
      type: "PaginatedSubmissions",
      args: {
        page: intArg({ default: 1 }),
        limit: intArg({ default: 10 }),
      },
      resolve: async (_, { page, limit }, ctx) => {
        const defaultLimit = 24;
        const defaultPage = 1;
        const skip = ((page ?? defaultPage) - 1) * (limit ?? defaultLimit);
        const takeValue = limit ?? defaultLimit;

        // Get sharing links for this user first
        const userSharingLinks = await ctx.db.query.sharingLinks.findMany({
          where: eq(sharingLinks.userId, ctx.user.id),
          columns: { id: true },
        });
        const sharingLinkIds = userSharingLinks.map(
          (link: { id: string }) => link.id,
        );

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

        // Get submissions with sharing link info
        const allSubmissions = await ctx.db.query.birthdaySubmissions.findMany({
          where: and(
            eq(birthdaySubmissions.status, "PENDING"),
            inArray(birthdaySubmissions.sharingLinkId, sharingLinkIds),
          ),
          with: {
            sharingLink: {
              columns: {
                description: true,
                createdAt: true,
              },
            },
          },
          orderBy: [desc(birthdaySubmissions.createdAt)],
        });

        const totalCount = allSubmissions.length;
        const paginatedSubmissions = allSubmissions.slice(
          skip,
          skip + takeValue,
        );

        return {
          submissions: paginatedSubmissions,
          totalCount,
          hasNextPage: skip + takeValue < totalCount,
          hasPreviousPage: (page ?? defaultPage) > 1,
          currentPage: page,
          totalPages: Math.ceil(totalCount / takeValue),
        };
      },
    });

    t.nullable.field("notificationPreferences", {
      type: "NotificationPreference",
      resolve: async (_, args, ctx) => {
        return ctx.db.query.notificationPreferences.findFirst({
          where: eq(notificationPreferences.userId, ctx.user.id),
        });
      },
    });

    t.nullable.field("validateSharingLink", {
      type: "SharingLinkValidation",
      args: {
        token: nonNull(stringArg()),
      },
      resolve: async (_, { token }, ctx) => {
        const sharingLink = await ctx.db.query.sharingLinks.findFirst({
          where: eq(sharingLinks.token, token),
          with: {
            user: {
              columns: {
                name: true,
              },
            },
          },
        });

        if (!sharingLink) {
          return {
            isValid: false,
            error: "INVALID_TOKEN",
            message: "This sharing link is not valid.",
          };
        }

        if (!sharingLink.isActive) {
          return {
            isValid: false,
            error: "INACTIVE_LINK",
            message: "This sharing link has been deactivated.",
          };
        }

        if (sharingLink.expiresAt <= new Date()) {
          // Automatically deactivate expired links
          await ctx.db
            .update(sharingLinks)
            .set({ isActive: false })
            .where(eq(sharingLinks.id, sharingLink.id));

          return {
            isValid: false,
            error: "EXPIRED_LINK",
            message: "This sharing link has expired.",
          };
        }

        return {
          isValid: true,
          sharingLink: {
            id: sharingLink.id,
            token: sharingLink.token,
            description: sharingLink.description,
            expiresAt: sharingLink.expiresAt,
            ownerName: sharingLink.user.name,
          },
        };
      },
    });
  },
});
