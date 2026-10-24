import Image from "next/image";
import Link from "next/link";

// Header and footer for public (signed-out) surfaces. Free of next/router and
// next/head so it can render in both the Pages Router (PublicLayout) and the
// App Router (app/layout.tsx, which only serves the not-found page).

export const PublicHeader = () => (
  <header className="flex justify-center px-4 md:px-8">
    <h1 className="pt-4 text-4xl font-semibold">
      <Link href="/">
        <Image
          alt="Lazy Uncle"
          height={47}
          priority
          src="/lazy-uncle.svg"
          width={160}
        />
      </Link>
    </h1>
  </header>
);

export const PublicFooter = () => (
  <footer className="px-4 py-6 text-center text-ink-soft md:flex md:justify-between md:px-8">
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
    <div className="mt-4 flex flex-wrap justify-center space-x-6 md:mt-0">
      <Link href="/policies" className="pt-4 underline md:pt-0">
        Policies
      </Link>
      <Link href="/contact" className="pt-4 underline md:pt-0">
        Contact
      </Link>
    </div>
  </footer>
);
