import { useApolloServerErrors } from "@envelop/apollo-server-errors";
import { createYoga } from "graphql-yoga";
import type { NextApiRequest, NextApiResponse } from "next";
import { createContext } from "../../graphql/context";
import { schema } from "../../graphql/schema";
import { aj } from "../../lib/arcjet";

const defaultExport = async (req: NextApiRequest, res: NextApiResponse) => {
  const decision = await aj.protect(req, { requested: 1 });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return res
        .status(429)
        .json({ error: "Too Many Requests", reason: decision.reason });
    } else if (decision.reason.isBot()) {
      return res
        .status(403)
        .json({ error: "No bots allowed", reason: decision.reason });
    } else {
      return res
        .status(403)
        .json({ error: "Forbidden", reason: decision.reason });
    }
  }

  return createYoga<{
    req: NextApiRequest;
    res: NextApiResponse;
  }>({
    schema,
    context: createContext,
    graphqlEndpoint: "/api/graphql",
    // eslint-disable-next-line react-hooks/rules-of-hooks
    plugins: [useApolloServerErrors()],
  });
};
export default defaultExport;
