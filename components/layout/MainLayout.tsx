import { signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import React, { ReactElement } from "react";

const MainLayout = ({
  children,
  title = "Lazy Uncle",
}: {
  children: ReactElement;
  title: string;
}) => {
  const { data: session } = useSession();
  return (
    <div className="bg-gray-100 min-h-screen">
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
      </Head>

      <header className="flex justify-between px-4 lg:px-8">
        <h1 className="text-4xl font-semibold pt-4">
          <Link href="/">
            <a>
              <Image
                alt="Lazy Uncle"
                height={50}
                src="/lazy-uncle.svg"
                width={160}
              />
            </a>
          </Link>
        </h1>
        {session?.user && (
          <button className="underline" onClick={() => signOut()}>
            Sign out
          </button>
        )}
      </header>
      {children}
      <footer className="bg-gray-100 px-4 lg:px-8 py-6 flex justify-between">
        <div>
          &copy; {new Date().getFullYear()}
          {` `}
          <a
            className="text-blue-600 underline"
            href="https://michaelbonner.dev"
          >
            Michael Bonner
          </a>
        </div>
        <div className="flex space-x-4">
          <a
            className="flex items-center space-x-2 text-blue-500 underline"
            href="https://github.com/sponsors/michaelbonner?o=esb"
          >
            <span>Sponsor Me</span>
          </a>

          <Link href="/policies">
            <a className="text-blue-600 underline">Policies</a>
          </Link>
        </div>
      </footer>
    </div>
  );
};
export default MainLayout;
