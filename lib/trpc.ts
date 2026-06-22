import type { AppRouter } from "../server/routers/_app";
import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";

export const trpc = createTRPCReact<AppRouter>();

/** Inferred input types for every procedure, e.g. RouterInputs["birthday"]["create"]. */
export type RouterInputs = inferRouterInputs<AppRouter>;
/** Inferred output types for every procedure, e.g. RouterOutputs["birthday"]["list"]. */
export type RouterOutputs = inferRouterOutputs<AppRouter>;

/** A single birthday as returned by the API (includes the derived `date` field). */
export type Birthday = RouterOutputs["birthday"]["list"][number];
