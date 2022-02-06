import { makeSchema } from "nexus";
import path from "path";
import * as MutationTypes from "./Mutation";
import * as QueryTypes from "./Query";

export const schema = makeSchema({
  types: [MutationTypes, QueryTypes],
  outputs: {
    typegen: path.join(process.cwd(), "generated", "nexus-typegen.ts"),
    schema: path.join(process.cwd(), "generated", "schema.graphql"),
  },
});
