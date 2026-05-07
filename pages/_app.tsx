import client from "../lib/apollo";
import { SearchProvider } from "../providers/SearchProvider";
import "../styles/globals.css";
import { ApolloProvider } from "@apollo/client/react";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import { Figtree, Source_Serif_4 } from "next/font/google";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import TagManager from "react-gtm-module";
import { Toaster } from "react-hot-toast";

const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-serif",
});

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  // checks that we are client-side
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
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
          <div className={`${figtree.variable} ${sourceSerif.variable}`}>
            <Component {...pageProps} />
          </div>
        </SearchProvider>
        <Toaster />
      </ApolloProvider>
    </PostHogProvider>
  );
}

export default MyApp;
