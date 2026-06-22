import type { Context } from "./context";
import { TRPCError, initTRPC } from "@trpc/server";
import superjson from "superjson";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const middleware = t.middleware;

/**
 * Public procedure — no auth required. Used for the public sharing-link flow
 * (validate a link, submit a birthday).
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure — requires an authenticated user. Narrows `ctx.user` to
 * be non-null for downstream resolvers, mirroring the GraphQL
 * `if (!ctx.user?.id) throw new Error("Unauthorized")` guard.
 */
export const protectedProcedure = t.procedure.use(
  middleware(({ ctx, next }) => {
    if (!ctx.user?.id) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  }),
);
