import { ApolloServer } from "apollo-server-micro";
import cors from "micro-cors";
import { RequestHandler } from "next/dist/server/next";
import { createContext } from "../../graphql/context";
import { schema } from "../../graphql/schema";

export const config = {
  api: {
    bodyParser: false,
  },
};

const apolloServer = new ApolloServer({ context: createContext, schema });

let apolloServerHandler: RequestHandler;

async function getApolloServerHandler() {
  if (!apolloServerHandler) {
    await apolloServer.start();

    apolloServerHandler = apolloServer.createHandler({
      path: "/api/graphql",
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
