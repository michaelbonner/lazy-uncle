import { authClient } from "../../lib/auth-client";
import ClientOnly from "../ClientOnly";
import SignInDialog from "../SignInDialog";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Script from "next/script";
import posthog from "posthog-js";
import { ReactElement, useEffect, useState } from "react";

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
  const [isSignInOpen, setIsSignInOpen] = useState(false);

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
    <div className="flex min-h-dvh flex-col bg-paper text-ink antialiased">
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
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://www.lazyuncle.net/og-image.png" />

        {/* PWA */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#24483e" />
        <meta name="msapplication-TileColor" content="#24483e" />

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
          color="#24483e"
        />
      </Head>

      <header className="border-b border-rule/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-2 px-5 py-4 sm:px-8 lg:px-12">
          <Link
            href="/"
            aria-label="Lazy Uncle home"
            className="inline-flex items-center"
          >
            <span className="font-display text-2xl font-semibold tracking-tight text-evergreen">
              lazy uncle<span className="text-accent">.</span>
            </span>
          </Link>
          <nav
            aria-label="Primary"
            className="order-3 flex w-full items-center gap-5 overflow-x-auto border-t border-rule/70 pt-2 text-sm text-ink-soft sm:order-none sm:w-auto sm:border-0 sm:pt-0"
          >
            {session?.user && (
              <Link
                href="/birthdays"
                aria-current={
                  router.asPath.startsWith("/birthdays") ? "page" : undefined
                }
                className="shrink-0 py-2 underline-offset-4 hover:text-ink hover:underline aria-[current=page]:text-ink aria-[current=page]:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                My birthdays
              </Link>
            )}
            <Link
              href="/features"
              aria-current={
                router.pathname === "/features" ? "page" : undefined
              }
              className="shrink-0 py-2 underline-offset-4 hover:text-ink hover:underline aria-[current=page]:text-ink aria-[current=page]:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              aria-current={
                router.pathname === "/how-it-works" ? "page" : undefined
              }
              className="shrink-0 py-2 underline-offset-4 hover:text-ink hover:underline aria-[current=page]:text-ink aria-[current=page]:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              How it works
            </Link>
            {session?.user ? (
              <button
                type="button"
                className="ml-auto shrink-0 py-2 underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:ml-0"
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
            ) : (
              !isPending && (
                <button
                  type="button"
                  className="ml-auto shrink-0 py-2 underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:ml-0"
                  onClick={() => setIsSignInOpen(true)}
                >
                  Sign in
                </button>
              )
            )}
          </nav>
        </div>
      </header>
      <SignInDialog
        isOpen={isSignInOpen}
        handleClose={() => setIsSignInOpen(false)}
      />
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
      <div className="isolate flex-1">
        <ClientOnly>{children}</ClientOnly>
      </div>
      <footer className="border-t border-rule px-5 py-8 text-sm text-ink-soft sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/features"
              className="underline underline-offset-4 hover:text-ink"
            >
              Features
            </Link>
            <Link
              href="/how-it-works"
              className="underline underline-offset-4 hover:text-ink"
            >
              How it works
            </Link>
            <a
              className="underline underline-offset-4 hover:text-ink"
              href="https://github.com/sponsors/michaelbonner?o=esb"
            >
              Sponsor Me
            </a>

            <Link
              href="/policies"
              className="underline underline-offset-4 hover:text-ink"
            >
              Policies
            </Link>
            <Link
              href="/contact"
              className="underline underline-offset-4 hover:text-ink"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default MainLayout;
