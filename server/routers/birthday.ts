import { birthdays } from "../../drizzle/schema";
import { InputValidator } from "../../lib/input-validator";
import { withBirthdayDate } from "../format";
import { protectedProcedure, router } from "../trpc";
import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

function validateDateComponents(
  month: number,
  day: number,
  year: number | null,
) {
  if (!InputValidator.validateMonth(month).isValid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid month: must be between 1 and 12",
    });
  }
  if (!InputValidator.validateDay(day, month, year).isValid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid day for the given month",
    });
  }
  if (year !== null && !InputValidator.validateYear(year).isValid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid year: must be between 1900 and next year",
    });
  }
}

export const birthdayRouter = router({
  byId: protectedProcedure
    .input(z.object({ birthdayId: z.string() }))
    .query(async ({ input, ctx }) => {
      const birthday = await ctx.db.query.birthdays.findFirst({
        where: eq(birthdays.id, input.birthdayId),
      });

      // Don't show birthdays that don't exist or belong to other users
      if (!birthday || birthday.userId !== ctx.user.id) {
        return null;
      }

      return withBirthdayDate(birthday);
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.query.birthdays.findMany({
      where: eq(birthdays.userId, ctx.user.id),
    });
    return rows.map(withBirthdayDate);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        year: z.number().nullish(),
        month: z.number(),
        day: z.number(),
        category: z.string().nullish(),
        parent: z.string().nullish(),
        notes: z.string().nullish(),
        remindersEnabled: z.boolean().nullish(),
        importSource: z.string().nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const year = input.year ?? null;
      validateDateComponents(input.month, input.day, year);

      const [birthday] = await ctx.db
        .insert(birthdays)
        .values({
          id: createId(),
          name: input.name,
          year,
          month: input.month,
          day: input.day,
          category: input.category || null,
          parent: input.parent || null,
          notes: input.notes || null,
          remindersEnabled: input.remindersEnabled ?? true,
          userId: ctx.user.id,
          importSource: input.importSource || "manual",
          createdAt: new Date(),
        })
        .returning();
      return withBirthdayDate(birthday);
    }),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        year: z.number().nullish(),
        month: z.number(),
        day: z.number(),
        category: z.string().nullish(),
        parent: z.string().nullish(),
        notes: z.string().nullish(),
        remindersEnabled: z.boolean().nullish(),
        importSource: z.string().nullish(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const year = input.year ?? null;
      validateDateComponents(input.month, input.day, year);

      const [birthday] = await ctx.db
        .update(birthdays)
        .set({
          name: input.name,
          year,
          month: input.month,
          day: input.day,
          category: input.category || null,
          parent: input.parent || null,
          notes: input.notes || null,
          ...(input.remindersEnabled !== null &&
          input.remindersEnabled !== undefined
            ? { remindersEnabled: input.remindersEnabled }
            : {}),
          importSource: input.importSource || null,
        })
        .where(and(eq(birthdays.id, input.id), eq(birthdays.userId, ctx.user.id)))
        .returning();
      if (!birthday) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Birthday not found or unauthorized",
        });
      }
      return withBirthdayDate(birthday);
    }),

  delete: protectedProcedure
    .input(z.object({ birthdayId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [birthday] = await ctx.db
        .delete(birthdays)
        .where(
          and(
            eq(birthdays.id, input.birthdayId),
            eq(birthdays.userId, ctx.user.id),
          ),
        )
        .returning();
      if (!birthday) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Birthday not found or unauthorized",
        });
      }
      return withBirthdayDate(birthday);
    }),
});
