import { figtree, sourceSerif } from "../lib/fonts";
import { TRPCProvider } from "../lib/trpc-provider";
import { SearchProvider } from "../providers/SearchProvider";
import "../styles/globals.css";
import type { AppProps } from "next/app";
import dynamic from "next/dynamic";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";
import TagManager from "react-gtm-module";
import { Toaster } from "react-hot-toast";

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  // checks that we are client-side
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: "https://g.michaelbonner.dev",
    defaults: "2026-05-30",
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
      <TRPCProvider>
        <PageLoadingProgress />
        <SearchProvider>
          <div className={`${figtree.variable} ${sourceSerif.variable}`}>
            <Component {...pageProps} />
          </div>
        </SearchProvider>
        <Toaster />
      </TRPCProvider>
    </PostHogProvider>
  );
}

export default MyApp;
