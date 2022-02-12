import { nonNull, objectType, queryType, stringArg } from "nexus";

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
  },
});
