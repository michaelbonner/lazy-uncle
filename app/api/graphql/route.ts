import { useApolloServerErrors } from "@envelop/apollo-server-errors";
import { createYoga } from "graphql-yoga";
import { createContext } from "../../../graphql/context";
import { schema } from "../../../graphql/schema";

export const POST = createYoga({
  schema,
  context: createContext,
  graphqlEndpoint: "/api/graphql",
  // eslint-disable-next-line react-hooks/rules-of-hooks
  plugins: [useApolloServerErrors()],
});
