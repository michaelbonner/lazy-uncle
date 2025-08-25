import { useApolloServerErrors } from "@envelop/apollo-server-errors";
import { createYoga } from "graphql-yoga";
import { createContext } from "../../../graphql/context";
import { schema } from "../../../graphql/schema";

interface NextContext {
  params: Promise<Record<string, string>>;
}

const { handleRequest } = createYoga<NextContext>({
  schema,
  context: createContext,

  // While using Next.js file convention for routing, we need to configure Yoga to use the correct endpoint
  graphqlEndpoint: "/api/graphql",

  // eslint-disable-next-line react-hooks/rules-of-hooks
  plugins: [useApolloServerErrors()],

  // Yoga needs to know how to create a valid Next response
  fetchAPI: { Response },
});

export {
  handleRequest as GET,
  handleRequest as OPTIONS,
  handleRequest as POST,
};
