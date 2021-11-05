import { intArg, nonNull, objectType, stringArg, extendType } from "nexus";

export const Birthday = objectType({
  name: "Birthday",
  definition(t) {
    t.string("id");
    t.int("index");
    t.int("userId");
    t.string("title");
    t.string("url");
    t.string("description");
    t.string("imageUrl");
    t.string("category");
  },
});

export const Edge = objectType({
  name: "Edges",
  definition(t) {
    t.string("cursor");
    t.field("node", {
      type: Birthday,
    });
  },
});

export const PageInfo = objectType({
  name: "PageInfo",
  definition(t) {
    t.string("endCursor");
    t.boolean("hasNextPage");
  },
});

export const Response = objectType({
  name: "Response",
  definition(t) {
    t.field("pageInfo", { type: PageInfo });
    t.list.field("edges", {
      type: Edge,
    });
  },
});

// get ALl Birthdays
export const BirthdaysQuery = extendType({
  type: "Query",
  definition(t) {
    t.field("birthdays", {
      type: "Response",
      args: {
        first: intArg(),
        after: stringArg(),
      },
      async resolve(_, args, ctx) {
        let queryResults = null;
        if (args.after) {
          queryResults = await ctx.prisma.birthday.findMany({
            take: args.first,
            skip: 1,
            cursor: {
              id: args.after,
            },
            orderBy: {
              index: "asc",
            },
          });
        } else {
          queryResults = await ctx.prisma.birthday.findMany({
            take: args.first,
            orderBy: {
              index: "asc",
            },
          });
        }

        if (queryResults.length > 0) {
          // last element
          const lastBirthdayInResults = queryResults[queryResults.length - 1];
          // cursor we'll return
          const myCursor = lastBirthdayInResults.id;

          // queries after the cursor to check if we have nextPage
          const secondQueryResults = await ctx.prisma.birthday.findMany({
            take: args.first,
            cursor: {
              id: myCursor,
            },
            orderBy: {
              index: "asc",
            },
          });

          const result = {
            pageInfo: {
              endCursor: myCursor,
              hasNextPage: secondQueryResults.length >= args.first,
            },
            edges: queryResults.map((birthday) => ({
              cursor: birthday.id,
              node: birthday,
            })),
          };
          return result;
        }
        return {
          pageInfo: {
            endCursor: null,
            hasNextPage: false,
          },
          edges: [],
        };
      },
    });
  },
});
// get Unique Birthday
export const BirthdayByIDQuery = extendType({
  type: "Query",
  definition(t) {
    t.nonNull.field("birthday", {
      type: "Birthday",
      args: { id: nonNull(stringArg()) },
      resolve(_parent, args, ctx) {
        const birthday = ctx.prisma.birthday.findUnique({
          where: {
            id: args.id,
          },
        });
        return birthday;
      },
    });
  },
});

// create birthday
export const CreateBirthdayMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("createBirthday", {
      type: Birthday,
      args: {
        title: nonNull(stringArg()),
        url: nonNull(stringArg()),
        imageUrl: nonNull(stringArg()),
        category: nonNull(stringArg()),
        description: nonNull(stringArg()),
      },
      async resolve(_parent, args, ctx) {
        // const user = await ctx.prisma.user.findUnique({
        //   where: {
        //     id: ctx.user.id,
        //   },
        // });
        const newBirthday = {
          title: args.title,
          url: args.url,
          imageUrl: args.imageUrl,
          category: args.category,
          description: args.description,
        };

        // if (user.role !== 'ADMIN') {
        //   throw new Error(`You do not have permission to perform action`);
        // }

        return await ctx.prisma.birthday.create({
          data: newBirthday,
        });
      },
    });
  },
});

// update Birthday
export const UpdateBirthdayMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("updateBirthday", {
      type: "Birthday",
      args: {
        id: stringArg(),
        title: stringArg(),
        url: stringArg(),
        imageUrl: stringArg(),
        category: stringArg(),
        description: stringArg(),
      },
      resolve(_parent, args, ctx) {
        return ctx.prisma.birthday.update({
          where: { id: args.id },
          data: {
            title: args.title,
            url: args.url,
            imageUrl: args.imageUrl,
            category: args.category,
            description: args.description,
          },
        });
      },
    });
  },
});
// // delete Birthday
export const DeleteBirthdayMutation = extendType({
  type: "Mutation",
  definition(t) {
    t.nonNull.field("deleteBirthday", {
      type: "Birthday",
      args: {
        id: nonNull(stringArg()),
      },
      resolve(_parent, args, ctx) {
        return ctx.prisma.birthday.delete({
          where: { id: args.id },
        });
      },
    });
  },
});
