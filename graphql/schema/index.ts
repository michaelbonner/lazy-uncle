import { DateTimeResolver } from "graphql-scalars";
import { asNexusMethod, makeSchema } from "nexus";
import path from "path";
import * as MutationTypes from "./Mutation";
import * as QueryTypes from "./Query";
import * as SharingTypes from "./Sharing";

export const DateTimeScalar = asNexusMethod(DateTimeResolver, "date");

export const schema = makeSchema({
  types: [MutationTypes, QueryTypes, SharingTypes, DateTimeScalar],
  outputs: {
    typegen: path.join(process.cwd(), "generated", "nexus-typegen.ts"),
    schema: path.join(process.cwd(), "generated", "schema.graphql"),
  },
});
