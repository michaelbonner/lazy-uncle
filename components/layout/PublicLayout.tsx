import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactElement } from "react";

const PublicLayout = ({
  children,
  description = "An easy way to keep track of birthdays",
  title = "Lazy Uncle",
}: {
  children: ReactElement;
  description?: string;
  title: string;
}) => {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col justify-between">
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
        <link
          rel="manifest"
          href="https://www.lazyuncle.net/site.webmanifest"
        />
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

      <header className="flex justify-center px-4 md:px-8">
        <h1 className="pt-4 text-4xl font-semibold">
          <Link href="/">
            <Image
              alt="Lazy Uncle"
              height={47}
              priority
              src="/lazy-uncle-white.svg"
              width={160}
            />
          </Link>
        </h1>
      </header>

      <main className="flex-1 px-4 py-8 md:px-8">{children}</main>

      <footer className="px-4 py-6 text-center text-gray-200 md:flex md:justify-between md:px-8">
        <div>
          &copy; 2020-{new Date().getFullYear()}
          {` `}
          <a className="underline" href="https://michaelbonner.dev">
            Michael Bonner
          </a>
        </div>
        <div className="mt-4 flex flex-wrap justify-center space-x-6 md:mt-0">
          <Link href="/policies" className="pt-4 underline md:pt-0">
            Policies
          </Link>
          <Link href="/contact" className="pt-4 underline md:pt-0">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
