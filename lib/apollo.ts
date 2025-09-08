import "@apollo/client";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { Defer20220824Handler } from "@apollo/client/incremental";
import { LocalState } from "@apollo/client/local-state";

const link = new HttpLink({ uri: "/api/graphql" });

const client = new ApolloClient({
  link,
  cache: new InMemoryCache(),

  /*
  Inserted by Apollo Client 3->4 migration codemod.
  If you are not using the `@client` directive in your application,
  you can safely remove this option.
  */
  localState: new LocalState({}),

  /*
  Inserted by Apollo Client 3->4 migration codemod.
  If you are not using the `@defer` directive in your application,
  you can safely remove this option.
  */
  incrementalHandler: new Defer20220824Handler(),
});

export default client;

/*
Start: Inserted by Apollo Client 3->4 migration codemod.
Copy the contents of this block into a `.d.ts` file in your project to enable correct response types in your custom links.
If you do not use the `@defer` directive in your application, you can safely remove this block.
*/

declare module "@apollo/client" {
  export interface TypeOverrides extends Defer20220824Handler.TypeOverrides {}
}

/*
End: Inserted by Apollo Client 3->4 migration codemod.
*/
