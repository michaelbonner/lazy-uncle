import { SubmissionStatus } from "@prisma/client";
import { intArg, nonNull, objectType, queryType, stringArg } from "nexus";

export const User = objectType({
  name: "User",
  definition(t) {
    t.string("id");
    t.string("name");
    t.string("email");
    t.list.field("birthdays", {
      type: "Birthday",
      resolve: (parent, args, ctx) =>
        ctx.prisma.user
          .findUnique({
            where: { id: parent.id || "6207fdc99b6c9796ff8e7d01" },
          })
          .birthdays(),
    });
  },
});

export const Birthday = objectType({
  name: "Birthday",
  definition(t) {
    t.string("id");
    t.string("name");
    t.string("date");
    t.string("category");
    t.string("parent");
    t.string("notes");
    t.string("importSource");
    t.field("createdAt", {
      type: "DateTime",
    });
    t.nullable.field("user", {
      type: "User",
      resolve: (parent, args, ctx) =>
        ctx.prisma.birthday
          .findUnique({
            where: { id: parent.id || "" },
          })
          .user(),
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
        const birthday = await ctx.prisma.birthday.findUnique({
          where: { id: args.birthdayId },
        });

        // don't show birthdays to other users
        if (birthday.userId !== ctx.user.id) {
          return {};
        }

        return birthday;
      },
    });

    t.list.field("birthdays", {
      type: "Birthday",
      resolve: (_, args, ctx) => {
        return ctx.prisma.birthday.findMany({
          where: { userId: ctx.user.id || "6207fdc99b6c9796ff8e7d01" },
        });
      },
    });

    t.list.field("users", {
      type: "User",
      resolve: (_, args, ctx) => {
        return ctx.prisma.user.findMany({});
      },
    });

    t.list.field("sharingLinks", {
      type: "SharingLink",
      resolve: (_, args, ctx) => {
        return ctx.prisma.sharingLink.findMany({
          where: {
            userId: ctx.user.id,
            isActive: true,
          },
          orderBy: { createdAt: "desc" },
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

        const [submissions, totalCount] = await Promise.all([
          ctx.prisma.birthdaySubmission.findMany({
            where: {
              sharingLink: {
                userId: ctx.user.id,
              },
              status: SubmissionStatus.PENDING,
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
              sharingLink: {
                select: {
                  description: true,
                  createdAt: true,
                },
              },
            },
          }),
          ctx.prisma.birthdaySubmission.count({
            where: {
              sharingLink: {
                userId: ctx.user.id,
              },
              status: SubmissionStatus.PENDING,
            },
          }),
        ]);

        return {
          submissions,
          totalCount,
          hasNextPage: skip + (limit ?? defaultLimit) < totalCount,
          hasPreviousPage: (page ?? defaultPage) > 1,
          currentPage: page,
          totalPages: Math.ceil(totalCount / (limit ?? defaultLimit)),
        };
      },
    });

    t.nullable.field("notificationPreferences", {
      type: "NotificationPreference",
      resolve: async (_, args, ctx) => {
        return ctx.prisma.notificationPreference.findUnique({
          where: { userId: ctx.user.id },
        });
      },
    });

    t.nullable.field("validateSharingLink", {
      type: "SharingLinkValidation",
      args: {
        token: nonNull(stringArg()),
      },
      resolve: async (_, { token }, ctx) => {
        const sharingLink = await ctx.prisma.sharingLink.findUnique({
          where: { token },
          include: {
            user: {
              select: {
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
          await ctx.prisma.sharingLink.update({
            where: { id: sharingLink.id },
            data: { isActive: false },
          });

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
