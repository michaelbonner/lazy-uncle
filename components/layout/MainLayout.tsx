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
    <div className="bg-teal-600 text-gray-50 min-h-screen">
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="An easy way to keep track of birthdays"
        />
        <link rel="icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#25303F" />
        <meta name="msapplication-TileColor" content="#25303F" />
        <meta name="theme-color" content="#25303F" />
        <meta
          property="og:image"
          content="https://www.lazyuncle.net/og-image.png"
        />
        <meta
          property="og:image:url"
          content="https://www.lazyuncle.net/og-image.png"
        />
      </Head>

      <header className="flex justify-between px-4 lg:px-8">
        <h1 className="text-4xl font-semibold pt-4">
          <Link href="/">
            <a>
              <Image
                alt="Lazy Uncle"
                height={50}
                src="/lazy-uncle-white.svg"
                width={160}
              />
            </a>
          </Link>
        </h1>
        {session?.user && (
          <div className="lg:flex items-center lg:space-x-4 text-right mt-8 lg:mt-0">
            <p className="hidden lg:block">
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
      <footer className="px-4 lg:px-8 py-6 lg:flex lg:justify-between text-gray-200 text-center">
        <div>
          &copy; {new Date().getFullYear()}
          {` `}
          <a className="underline" href="https://michaelbonner.dev">
            Michael Bonner
          </a>
        </div>
        <div className="flex flex-wrap space-x-6 mt-4 lg:mt-0 justify-center">
          <a
            className="underline pt-4 lg:pt-0 flex items-center space-x-1"
            href="https://github.com/michaelbonner/lazy-uncle/issues/new?assignees=michaelbonner&labels=&template=bug_report.md&title="
          >
            <RiBugFill className="w-4 h-4" />
            <span>Report a bug</span>
          </a>
          <a
            className="underline pt-4 lg:pt-0 flex items-center space-x-1"
            href="https://github.com/michaelbonner/lazy-uncle/issues/new?assignees=michaelbonner&labels=&template=feature_request.md&title="
          >
            <RiLightbulbFlashLine className="w-4 h-4" />
            <span>Request a feature</span>
          </a>
          <a
            className="underline pt-4 lg:pt-0"
            href="https://github.com/sponsors/michaelbonner?o=esb"
          >
            Sponsor Me
          </a>

          <Link href="/policies">
            <a className="underline pt-4 lg:pt-0">Policies</a>
          </Link>
          <Link href="/contact">
            <a className="underline pt-4 lg:pt-0">Contact</a>
          </Link>
        </div>
      </footer>
    </div>
  );
};
export default MainLayout;
