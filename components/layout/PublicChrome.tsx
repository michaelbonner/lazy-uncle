import Link from "next/link";

// Header and footer for public (signed-out) surfaces. Free of next/router and
// next/head so it can render in both the Pages Router (PublicLayout) and the
// App Router (app/layout.tsx, which only serves the not-found page).

export const PublicHeader = () => (
  <header className="border-b border-rule/70">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8 lg:px-12">
      <Link
        href="/"
        aria-label="Lazy Uncle home"
        className="inline-flex shrink-0 items-center"
      >
        <span className="font-display text-2xl font-semibold tracking-tight text-evergreen">
          lazy uncle<span className="text-accent">.</span>
        </span>
      </Link>
      <nav
        aria-label="Primary"
        className="flex items-center gap-5 text-sm text-ink-soft"
      >
        <Link
          href="/features"
          className="py-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Features
        </Link>
        <Link
          href="/how-it-works"
          className="py-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          How it works
        </Link>
      </nav>
    </div>
  </header>
);

export const PublicFooter = () => (
  <footer className="border-t border-rule px-5 py-8 text-sm text-ink-soft sm:px-8 lg:px-12">
    <div className="mx-auto flex max-w-7xl flex-col gap-5 sm:flex-row sm:justify-between">
      <div>
        &copy; 2020-{new Date().getFullYear()}
        {` `}
        <a
          className="underline underline-offset-4 hover:text-ink"
          href="https://michaelbonner.dev"
        >
          Michael Bonner
        </a>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
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
);
