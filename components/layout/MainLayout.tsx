import { signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import React, { ReactElement } from "react";

import { RiBugFill, RiLightbulbFlashLine } from "react-icons/ri";
import ClientOnly from "../ClientOnly";

const MainLayout = ({
  children,
  title = "Lazy Uncle",
}: {
  children: ReactElement;
  title: string;
}) => {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <Head>
        {/* General */}
        <title>{title}</title>
        <meta
          name="description"
          content="An easy way to keep track of birthdays"
        />
        <link rel="icon" href="https://www.lazyuncle.net/favicon.png" />

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
        <meta
          property="og:image"
          content="https://www.lazyuncle.net/og-image.png"
        />
        <meta
          property="og:image:url"
          content="https://www.lazyuncle.net/og-image.png"
        />

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

      <header className="flex justify-between px-4 md:px-8">
        <h1 className="text-4xl font-semibold pt-4">
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
        {session?.user && (
          <div className="md:flex items-center md:space-x-4 text-right mt-8 md:mt-0">
            <p className="hidden md:block">
              Logged in as {session?.user?.email}
            </p>
            <button
              className="underline"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </button>
          </div>
        )}
      </header>
      <ClientOnly>{children}</ClientOnly>
      <footer className="px-4 md:px-8 py-6 md:flex md:justify-between text-gray-200 text-center">
        <div>
          &copy; {new Date().getFullYear()}
          {` `}
          <a className="underline" href="https://michaelbonner.dev">
            Michael Bonner
          </a>
        </div>
        <div className="flex flex-wrap space-x-6 mt-4 md:mt-0 justify-center">
          <a
            className="underline pt-4 md:pt-0 flex items-center space-x-1"
            href="https://github.com/michaelbonner/lazy-uncle/issues/new?assignees=michaelbonner&labels=&template=bug_report.md&title="
          >
            <RiBugFill className="w-4 h-4" />
            <span>Report a bug</span>
          </a>
          <a
            className="underline pt-4 md:pt-0 flex items-center space-x-1"
            href="https://github.com/michaelbonner/lazy-uncle/issues/new?assignees=michaelbonner&labels=&template=feature_request.md&title="
          >
            <RiLightbulbFlashLine className="w-4 h-4" />
            <span>Request a feature</span>
          </a>
          <a
            className="underline pt-4 md:pt-0"
            href="https://github.com/sponsors/michaelbonner?o=esb"
          >
            Sponsor Me
          </a>

          <Link href="/policies" className="underline pt-4 md:pt-0">
            Policies
          </Link>
          <Link href="/contact" className="underline pt-4 md:pt-0">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
};
export default MainLayout;
