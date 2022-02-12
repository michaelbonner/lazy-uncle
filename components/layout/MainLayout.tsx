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
    <div className="bg-teal-600 text-gray-50 min-h-screen flex flex-col justify-between">
      <Head>
        {/* General */}
        <title>{title}</title>
        <meta
          name="description"
          content="An easy way to keep track of birthdays"
        />
        <link rel="icon" href="/favicon.ico" />

        {/* PWA */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0f766e" />
        <meta name="msapplication-TileColor" content="#13b8a6" />

        {/* Icons */}
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
          href="/apple-touch-icon.png"
        />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#13b8a6" />

        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          href="/splashscreens/icon_1136x640.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
          href="/splashscreens/icon_2436x1125.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          href="/splashscreens/icon_1792x828.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/icon_828x1792.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          href="/splashscreens/icon_1334x750.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splashscreens/icon_1242x2688.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
          href="/splashscreens/icon_2208x1242.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splashscreens/icon_1125x2436.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)"
          href="/splashscreens/icon_1242x2208.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          href="/splashscreens/icon_2732x2048.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: landscape)"
          href="/splashscreens/icon_2688x1242.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          href="/splashscreens/icon_2224x1668.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/icon_750x1334.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/icon_2048x2732.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          href="/splashscreens/icon_2388x1668.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/icon_1668x2224.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/icon_640x1136.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/icon_1668x2388.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: landscape)"
          href="/splashscreens/icon_2048x1536.png"
        />
        <link
          rel="apple-touch-startup-image"
          media="screen and (device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)"
          href="/splashscreens/icon_1536x2048.png"
        />
      </Head>

      <header className="flex justify-between px-4 md:px-8">
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

          <Link href="/policies">
            <a className="underline pt-4 md:pt-0">Policies</a>
          </Link>
          <Link href="/contact">
            <a className="underline pt-4 md:pt-0">Contact</a>
          </Link>
        </div>
      </footer>
    </div>
  );
};
export default MainLayout;
