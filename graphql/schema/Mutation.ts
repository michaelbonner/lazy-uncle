import { extendType, nonNull, stringArg } from "nexus";

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
      },
      resolve: (_, { name, date, category, parent, notes, userId }, ctx) => {
        return ctx.prisma.birthday.create({
          data: {
            name,
            date,
            category,
            parent,
            notes,
            userId,
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
      },
      resolve: (_, { id, name, date, category, parent, notes }, ctx) => {
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
  },
});
