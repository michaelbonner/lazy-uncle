import { ApolloProvider } from "@apollo/client";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import TagManager from "react-gtm-module";
import { Toaster } from "react-hot-toast";
import { PageLoadingProgress } from "../components/PageLoadingProgress";
import client from "../lib/apollo";
import { SearchProvider } from "../providers/SearchProvider";

import "../styles/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    TagManager.initialize({ gtmId: "GTM-W76BXL4" });
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <ApolloProvider client={client}>
        <PageLoadingProgress />
        <SearchProvider>
          <Component {...pageProps} />
        </SearchProvider>
        <Toaster />
      </ApolloProvider>
    </SessionProvider>
  );
}

export default MyApp;
