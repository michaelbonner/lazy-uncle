import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import posthog from "posthog-js";
import { ReactElement, useEffect } from "react";
import { RiBugFill, RiLightbulbFlashLine } from "react-icons/ri";
import { authClient } from "../../lib/auth-client";
import ClientOnly from "../ClientOnly";

const MainLayout = ({
  children,
  title = "Lazy Uncle",
}: {
  children: ReactElement;
  title: string;
}) => {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) return;

    posthog.identify(session?.user?.id, {
      email: session?.user?.email,
      name: session?.user?.name,
    });
  }, [session, isPending]);

  return (
    <div className="flex min-h-screen flex-col justify-between">
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
          <div className="mt-8 items-center text-right md:mt-0 md:flex md:space-x-4">
            <p className="hidden md:block">
              Logged in as {session?.user?.email}
            </p>
            <button
              className="underline"
              onClick={async () => {
                await authClient.signOut();
                posthog.reset();
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </header>
      <ClientOnly>{children}</ClientOnly>
      <footer className="px-4 py-6 text-center text-gray-200 md:flex md:justify-between md:px-8">
        <div>
          &copy; 2020-{new Date().getFullYear()}
          {` `}
          <a className="underline" href="https://michaelbonner.dev">
            Michael Bonner
          </a>
        </div>
        <div className="mt-4 flex flex-wrap justify-center space-x-6 md:mt-0">
          <a
            className="flex items-center space-x-1 pt-4 underline md:pt-0"
            href="https://github.com/michaelbonner/lazy-uncle/issues/new?assignees=michaelbonner&labels=&template=bug_report.md&title="
          >
            <RiBugFill className="h-4 w-4" />
            <span>Report a bug</span>
          </a>
          <a
            className="flex items-center space-x-1 pt-4 underline md:pt-0"
            href="https://github.com/michaelbonner/lazy-uncle/issues/new?assignees=michaelbonner&labels=&template=feature_request.md&title="
          >
            <RiLightbulbFlashLine className="h-4 w-4" />
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
