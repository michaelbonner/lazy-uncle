import { signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import { ReactElement, useEffect } from "react";

import { RiBugFill, RiLightbulbFlashLine } from "react-icons/ri";
import ClientOnly from "../ClientOnly";

const MainLayout = ({
  children,
  title = "Lazy Uncle",
}: {
  children: ReactElement;
  title: string;
}) => {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") return;

    posthog.identify(session?.user?.id, {
      email: session?.user?.email,
      name: session?.user?.name,
    });
  }, [session, status]);

  return (
    <div className="flex flex-col justify-between min-h-screen">
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
        {session?.user && (
          <div className="items-center mt-8 text-right md:flex md:mt-0 md:space-x-4">
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
      <footer className="py-6 px-4 text-center text-gray-200 md:flex md:justify-between md:px-8">
        <div>
          &copy; {new Date().getFullYear()}
          {` `}
          <a className="underline" href="https://michaelbonner.dev">
            Michael Bonner
          </a>
        </div>
        <div className="flex flex-wrap justify-center mt-4 space-x-6 md:mt-0">
          <a
            className="flex items-center pt-4 space-x-1 underline md:pt-0"
            href="https://github.com/michaelbonner/lazy-uncle/issues/new?assignees=michaelbonner&labels=&template=bug_report.md&title="
          >
            <RiBugFill className="w-4 h-4" />
            <span>Report a bug</span>
          </a>
          <a
            className="flex items-center pt-4 space-x-1 underline md:pt-0"
            href="https://github.com/michaelbonner/lazy-uncle/issues/new?assignees=michaelbonner&labels=&template=feature_request.md&title="
          >
            <RiLightbulbFlashLine className="w-4 h-4" />
            <span>Request a feature</span>
          </a>
          <a
            className="pt-4 underline md:pt-0"
            href="https://github.com/sponsors/michaelbonner?o=esb"
          >
            Sponsor Me
          </a>

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
export default MainLayout;
