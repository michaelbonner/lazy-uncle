import { ApolloProvider } from "@apollo/client";
import { SessionProvider } from "next-auth/react";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import TagManager from "react-gtm-module";
import { ToastContainer } from "react-toastify";
import { PageLoadingProgress } from "../components/PageLoadingProgress";
import client from "../lib/apollo";
import { SearchProvider } from "../providers/SearchProvider";

import "react-toastify/dist/ReactToastify.css";
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
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </ApolloProvider>
    </SessionProvider>
  );
}

export default MyApp;
