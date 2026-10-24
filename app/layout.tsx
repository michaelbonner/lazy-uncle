import { PublicFooter, PublicHeader } from "../components/layout/PublicChrome";
import { figtree, sourceSerif } from "../lib/fonts";
import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { ReactNode } from "react";

// The UI lives in pages/. The App Router only hosts API route handlers and
// app/not-found.tsx, which answers every unmatched URL in this hybrid app, so
// this root layout exists to give that page the same shell as PublicLayout.
export const metadata: Metadata = {
  title: "Lazy Uncle",
  description: "An easy way to keep track of birthdays",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "https://www.lazyuncle.net/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#0891b2",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${sourceSerif.variable}`}>
      <body>
        <div className="flex min-h-screen flex-col justify-between bg-paper text-ink">
          <PublicHeader />
          <main className="flex-1 px-4 py-8 md:px-8">{children}</main>
          <PublicFooter />
        </div>
      </body>
    </html>
  );
}
