import { authClient } from "../../lib/auth-client";
import ClientOnly from "../ClientOnly";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import { ReactElement, useEffect } from "react";
import Script from "next/script";

const MainLayout = ({
  children,
  description = "An easy way to keep track of birthdays",
  title = "Lazy Uncle",
}: {
  children: ReactElement;
  description?: string;
  title: string;
}) => {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (isPending) return;
    if (!session) return;

    if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.identify(session?.user?.id, {
        email: session?.user?.email,
        name: session?.user?.name,
      });
    }
  }, [session, isPending]);

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

      <header className="flex items-center justify-between px-6 pt-8 md:px-12 md:pt-10">
        <Link
          href="/"
          aria-label="Lazy Uncle home"
          className="inline-flex items-center"
        >
          <Image
            alt="Lazy Uncle"
            height={39}
            priority
            src="/lazy-uncle.svg"
            style={{ height: "auto" }}
            width={130}
          />
        </Link>
        {session?.user && (
          <div className="items-center text-right text-sm text-ink-soft md:flex md:space-x-4">
            <p className="hidden md:block">
              Logged in as {session?.user?.email}
            </p>
            <button
              className="underline underline-offset-4 transition hover:text-ink"
              onClick={async () => {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push("/");
                      posthog.reset();
                    },
                  },
                });
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </header>
      <Script
        async
        src="https://easycustomerfeedback.com/widget/d1f086e2aab04637a566c3babcee1493/embed"
        data-label="Send feedback"
        data-position="right"
        data-color="#111827"
        {...(session?.user && {
          "data-name": session.user.name ?? undefined,
          "data-email": session.user.email ?? undefined,
          "data-user-id": session.user.id,
        })}
      />
      <ClientOnly>{children}</ClientOnly>
      <footer className="border-t border-rule px-6 py-6 text-center text-sm text-ink-soft md:flex md:justify-between md:px-12">
        <div>
          &copy; 2020-{new Date().getFullYear()}
          {` `}
          <a
            className="underline underline-offset-4 transition hover:text-ink"
            href="https://michaelbonner.dev"
          >
            Michael Bonner
          </a>
        </div>
        <div className="mt-4 flex flex-wrap justify-center space-x-6 md:mt-0">
          <a
            className="pt-4 underline underline-offset-4 transition hover:text-ink md:pt-0"
            href="https://github.com/sponsors/michaelbonner?o=esb"
          >
            Sponsor Me
          </a>

          <Link
            href="/policies"
            className="pt-4 underline underline-offset-4 transition hover:text-ink md:pt-0"
          >
            Policies
          </Link>
          <Link
            href="/contact"
            className="pt-4 underline underline-offset-4 transition hover:text-ink md:pt-0"
          >
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
};
export default MainLayout;
