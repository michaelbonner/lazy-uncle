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
  openGraph: {
    images: [{ url: "https://www.lazyuncle.net/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://www.lazyuncle.net/og-image.png"],
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#24483e",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${figtree.variable} ${sourceSerif.variable}`}>
      <body className="site-font">
        <div className="flex min-h-dvh flex-col bg-paper text-ink antialiased">
          <PublicHeader />
          <main className="isolate flex-1 px-5 py-8 sm:px-8 lg:px-12">
            {children}
          </main>
          <PublicFooter />
        </div>
      </body>
    </html>
  );
}
