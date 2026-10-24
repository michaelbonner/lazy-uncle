"use client";

import { useEffect } from "react";

// Replaces app/layout.tsx when the root layout itself fails, so it must not
// rely on globals.css, next/font or any shared layout. Colors mirror the
// paper/ink/accent tokens in styles/globals.css.
const colors = {
  paper: "oklch(0.97 0.012 80)",
  ink: "oklch(0.22 0.018 60)",
  inkSoft: "oklch(0.42 0.014 70)",
  inkMuted: "oklch(0.5 0.012 72)",
  rule: "oklch(0.86 0.012 78)",
  accent: "oklch(0.45 0.085 200)",
};

const buttonBase = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: "0.375rem",
  padding: "0.5rem 1rem",
  font: "inherit",
  fontWeight: 500,
  textDecoration: "none",
  cursor: "pointer",
} as const;

export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string"
      ? error.digest
      : "";

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem 1rem",
          boxSizing: "border-box",
          backgroundColor: colors.paper,
          color: colors.ink,
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
          WebkitFontSmoothing: "antialiased",
          textAlign: "center",
        }}
      >
        <title>Something went wrong | Lazy Uncle</title>
        <main style={{ maxWidth: "36rem" }}>
          <p
            style={{
              margin: 0,
              fontSize: "0.875rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: colors.inkMuted,
            }}
          >
            Lazy Uncle
          </p>
          <h1
            style={{
              margin: "0.75rem 0 0",
              fontFamily: 'ui-serif, Georgia, "Times New Roman", serif',
              fontSize: "2.5rem",
              lineHeight: 1.1,
              fontWeight: 600,
              textWrap: "balance",
            }}
          >
            Something went wrong.
          </h1>
          <p
            style={{
              margin: "1.5rem 0 0",
              fontSize: "1.125rem",
              lineHeight: 1.6,
              color: colors.inkSoft,
            }}
          >
            Lazy Uncle couldn&rsquo;t load this page. Nothing you saved has been
            lost. Try again, and if it keeps happening, head back home and start
            from there.
          </p>
          {digest && (
            <p
              style={{
                margin: "1rem 0 0",
                fontSize: "0.875rem",
                color: colors.inkMuted,
              }}
            >
              Reference: {digest}
            </p>
          )}
          <div
            style={{
              marginTop: "2.5rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "1rem",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={() => retry()}
              style={{
                ...buttonBase,
                border: `1px solid ${colors.rule}`,
                backgroundColor: colors.paper,
                color: colors.ink,
              }}
            >
              Try again
            </button>
            {/* Plain <a> on purpose: a full reload is the safest way out of a
                broken root layout. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                ...buttonBase,
                border: "1px solid transparent",
                backgroundColor: colors.accent,
                color: "white",
              }}
            >
              Back to Lazy Uncle
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
