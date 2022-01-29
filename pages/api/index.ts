import { ApolloServer } from "apollo-server-micro";
import { DateTimeResolver } from "graphql-scalars";
import { NextApiHandler } from "next";
import {
  asNexusMethod,
  makeSchema,
  nonNull,
  nullable,
  objectType,
  stringArg,
} from "nexus";
import path from "path";
import cors from "micro-cors";
import prisma from "../../lib/prisma";
import { RequestHandler } from "next/dist/server/next";

export const GQLDate = asNexusMethod(DateTimeResolver, "date");

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

const Query = objectType({
  name: "Query",
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
      resolve: (_parent, _args) => {
        return prisma.birthday.findMany({});
      },
    });

    t.list.field("users", {
      type: "User",
      resolve: (_parent, _args) => {
        return prisma.user.findMany({});
      },
    });
  },
});

const Mutation = objectType({
  name: "Mutation",
  definition(t) {
    t.field("signupUser", {
      type: "User",
      args: {
        name: stringArg(),
        email: nonNull(stringArg()),
      },
      resolve: (_, { name, email }, ctx) => {
        return prisma.user.create({
          data: {
            name,
            email,
          },
        });
      },
    });

    t.nullable.field("deleteBirthday", {
      type: "Birthday",
      args: {
        birthdayId: nonNull(stringArg()),
      },
      resolve: (_, { birthdayId }, ctx) => {
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
        userId: nonNull(stringArg()),
      },
      resolve: (_, { name, date, userId }, ctx) => {
        return prisma.birthday.create({
          data: {
            name,
            date,
            user: {
              connect: { id: userId || "" },
            },
          },
        });
      },
    });
  },
});

export const schema = makeSchema({
  types: [Query, Mutation, Birthday, User, GQLDate],
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
      path: "/api",
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
