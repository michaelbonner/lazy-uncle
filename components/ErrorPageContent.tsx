import PublicLayout from "./layout/PublicLayout";
import Head from "next/head";
import { ReactNode } from "react";

// Pages Router wrapper for error pages. Uses PublicLayout rather than
// MainLayout because MainLayout wraps its children in ClientOnly (nothing
// renders without JS) and fetches the auth session, neither of which we want
// on a page that exists because something already went wrong.
const ErrorPageContent = ({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) => (
  <PublicLayout title={`${title} | Lazy Uncle`}>
    <Head>
      <meta name="robots" content="noindex" />
    </Head>
    {children}
  </PublicLayout>
);

export default ErrorPageContent;
