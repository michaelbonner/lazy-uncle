import { enumType, intArg, objectType, stringArg } from "nexus";
import { extendType } from "nexus";
import { Birthday } from "./Birthday";

export const User = objectType({
  name: "User",
  definition(t) {
    t.string("id");
    t.string("name");
    t.string("email");
    t.field("role", { type: Role });
    t.list.field("favorites", {
      type: Birthday,
      async resolve(_parent, _args, ctx) {
        return await ctx.prisma.user
          .findUnique({
            where: {
              id: _parent.id,
            },
          })
          .favorites();
      },
    });
  },
});

const Role = enumType({
  name: "Role",
  members: ["USER", "ADMIN"],
});

export const UserFavorites = extendType({
  type: "Query",
  definition(t) {
    t.field("favorites", {
      type: "Birthday",
      async resolve(_, _args, ctx) {
        const user = ctx.prisma.user.findUnique({
          where: {
            email: "abdelwahab@prisma.io",
          },
          include: {
            favorites: true,
          },
        });
        return user.favorites;
      },
    });
  },
});

export const AddBirthday = extendType({
  type: "Mutation",
  definition(t) {
    t.field("bookmarkBirthday", {
      type: "Birthday",
      args: {
        id: stringArg(),
      },
      async resolve(_, args, ctx) {
        console.log(ctx);
        const birthday = await ctx.prisma.birthday.findUnique({
          where: { id: args.id },
        });

        await ctx.prisma.user.update({
          where: {
            email: "abdelwahab@prisma.io",
          },
          data: {
            favorites: {
              connect: {
                id: birthday.id,
              },
            },
          },
        });
        return birthday;
      },
    });
  },
});
