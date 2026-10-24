import Link from "next/link";
import { ReactNode } from "react";

export const secondaryButtonClassName =
  "inline-flex items-center rounded-md border border-rule bg-paper px-4 py-2 font-medium text-ink transition hover:bg-paper-deep focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-paper focus:outline-hidden";

// Router-agnostic body for error and not-found pages. Always offers a way
// home; `action` adds an extra button (e.g. "Try again") before it.
const ErrorMessage = ({
  action,
  body,
  eyebrow,
  heading,
}: {
  action?: ReactNode;
  body: ReactNode;
  eyebrow: string;
  heading: string;
}) => (
  <section className="mx-auto max-w-2xl py-12 text-center md:py-20">
    <p className="font-sans text-sm tracking-[0.18em] text-ink-muted uppercase">
      {eyebrow}
    </p>
    <h2 className="mt-3 font-display text-4xl leading-[1.08] font-semibold text-balance text-ink md:text-5xl">
      {heading}
    </h2>
    <div className="mx-auto mt-6 max-w-xl space-y-4 font-sans text-lg leading-relaxed text-ink-soft">
      {body}
    </div>
    <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
      {action}
      <Link
        href="/"
        className="inline-flex items-center rounded-md border border-transparent bg-accent px-4 py-2 font-medium text-white transition hover:bg-accent-deep focus:ring-2 focus:ring-accent/40 focus:ring-offset-2 focus:ring-offset-paper focus:outline-hidden"
      >
        Back to Lazy Uncle
      </Link>
    </div>
  </section>
);

export default ErrorMessage;
