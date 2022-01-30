import { signOut, useSession } from "next-auth/react";
import Head from "next/head";
import Image from "next/image";
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
      </Head>

      <header className="flex justify-between px-4 lg:px-8">
        <h1 className="text-4xl font-semibold pt-4">
          <Image
            alt="Lazy Uncle"
            height={80}
            src="/lazy-uncle.svg"
            width={200}
          />
        </h1>
        {session?.user && (
          <button className="underline" onClick={() => signOut()}>
            Sign out
          </button>
        )}
      </header>
      {children}
      <footer className="bg-gray-100 px-4 lg:px-8 py-6">
        &copy; {new Date().getFullYear()}
        {` `}
        <a className="text-blue-600 underline" href="https://michaelbonner.dev">
          Michael Bonner
        </a>
      </footer>
    </div>
  );
};
export default MainLayout;
