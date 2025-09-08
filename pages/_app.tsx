import { ApolloProvider } from "@apollo/client/react";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import TagManager from "react-gtm-module";
import { Toaster } from "react-hot-toast";
import client from "../lib/apollo";
import { SearchProvider } from "../providers/SearchProvider";

import "../styles/globals.css";

if (typeof window !== "undefined") {
  // checks that we are client-side
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "", {
    api_host:
      process.env.NEXT_PUBLIC_POSTHOG_HOST ||
      "https://www.lazyuncle.net/ingest",
    person_profiles: "identified_only",
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
  });
}

const PageLoadingProgress = dynamic(
  () =>
    import("../components/PageLoadingProgress").then(
      (mod) => mod.PageLoadingProgress,
    ),
  {
    ssr: false,
  },
);

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    TagManager.initialize({ gtmId: "GTM-W76BXL4" });
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <ApolloProvider client={client}>
        <PageLoadingProgress />
        <SearchProvider>
          <Component {...pageProps} />
        </SearchProvider>
        <Toaster />
      </ApolloProvider>
    </PostHogProvider>
  );
}

export default MyApp;
