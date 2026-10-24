import { PublicFooter, PublicHeader } from "./PublicChrome";
import Head from "next/head";
import { useRouter } from "next/router";

const PublicLayout = ({
  children,
  description = "An easy way to keep track of birthdays",
  title = "Lazy Uncle",
}: {
  children: React.ReactNode;
  description?: string;
  title?: string;
}) => {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col justify-between bg-paper text-ink">
      <Head>
        {/* General */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="https://www.lazyuncle.net/favicon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light only" />
        <link
          rel="canonical"
          href={`https://www.lazyuncle.net${router.asPath}`}
        />

        {/* Open Graph */}
        <meta
          property="og:url"
          content={`https://www.lazyuncle.net${router.asPath}`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta
          property="og:image"
          content="https://www.lazyuncle.net/og-image.png"
        />

        {/* PWA */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0891b2" />
        <meta name="msapplication-TileColor" content="#0891b2" />

        {/* Icons */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />

        {/* Apple specific */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Lazy Uncle" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="https://www.lazyuncle.net/apple-touch-icon.png"
        />
        <link
          rel="mask-icon"
          href="https://www.lazyuncle.net/safari-pinned-tab.svg"
          color="#13b8a6"
        />
      </Head>

      <PublicHeader />

      <main className="flex-1 px-4 py-8 md:px-8">{children}</main>

      <PublicFooter />
    </div>
  );
};

export default PublicLayout;
