import { ApolloServer } from "apollo-server-micro";
import cors from "micro-cors";
import { RequestHandler } from "next/dist/server/next";
import { makeSchema, nonNull, objectType, queryType, stringArg } from "nexus";
import path from "path";
import prisma from "../../lib/prisma";

const User = objectType({
  name: "User",
  definition(t) {
    t.string("id");
    t.string("name");
    t.string("email");
    t.list.field("birthdays", {
      type: "Birthday",
      resolve: (parent) =>
        prisma.user
          .findUnique({
            where: { id: parent.id || "" },
          })
          .birthdays(),
    });
  },
});

const Birthday = objectType({
  name: "Birthday",
  definition(t) {
    t.string("id");
    t.string("name");
    t.string("date");
    t.string("category");
    t.string("parent");
    t.nullable.field("user", {
      type: "User",
      resolve: (parent) =>
        prisma.birthday
          .findUnique({
            where: { id: parent.id || "" },
          })
          .user(),
    });
  },
});

const Query = queryType({
  definition(t) {
    t.field("birthday", {
      type: "Birthday",
      args: {
        birthdayId: nonNull(stringArg()),
      },
      resolve: (_, args) => {
        return prisma.birthday.findUnique({
          where: { id: args.birthdayId },
        });
      },
    });

    t.list.field("birthdays", {
      type: "Birthday",
      args: {
        userId: nonNull(stringArg()),
      },
      resolve: (_, args) => {
        return prisma.birthday.findMany({
          where: { userId: args.userId },
        });
      },
    });

    t.list.field("users", {
      type: "User",
      resolve: () => {
        return prisma.user.findMany({});
      },
    });
  },
});

const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    t.nullable.field("deleteBirthday", {
      type: "Birthday",
      args: {
        birthdayId: nonNull(stringArg()),
      },
      resolve: (_, { birthdayId }) => {
        return prisma.birthday.delete({
          where: { id: birthdayId || "" },
        });
      },
    });

    t.field("createBirthday", {
      type: "Birthday",
      args: {
        name: nonNull(stringArg()),
        date: nonNull(stringArg()),
        category: stringArg(),
        parent: stringArg(),
        userId: nonNull(stringArg()),
      },
      resolve: (_, { name, date, category, parent, userId }) => {
        return prisma.birthday.create({
          data: {
            name,
            date,
            category,
            parent,
            user: {
              connect: { id: userId || "" },
            },
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
      },
      resolve: (_, { id, name, date, category, parent }) => {
        return prisma.birthday.update({
          where: {
            id: id,
          },
          data: {
            name,
            date,
            category,
            parent,
          },
        });
      },
    });
  },
});

const schema = makeSchema({
  types: [Query, Mutation, Birthday, User],
  outputs: {
    typegen: path.join(process.cwd(), "generated/nexus-typegen.ts"),
    schema: path.join(process.cwd(), "generated/schema.graphql"),
  },
});

export const config = {
  api: {
    bodyParser: false,
  },
};

const apolloServer = new ApolloServer({ schema });

let apolloServerHandler: RequestHandler;

async function getApolloServerHandler() {
  if (!apolloServerHandler) {
    await apolloServer.start();

    apolloServerHandler = apolloServer.createHandler({
      path: "/api/graphql",
    });
  }

  return apolloServerHandler;
}

const handler: RequestHandler = async (req, res) => {
  const apolloServerHandler = await getApolloServerHandler();

  if (req.method === "OPTIONS") {
    res.end();
    return;
  }

  return apolloServerHandler(req, res);
};

export default cors()(handler);
