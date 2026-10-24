import { Figtree, Source_Serif_4 } from "next/font/google";

// Shared by pages/_app.tsx and app/layout.tsx so both routers use the same
// font instances and CSS variables (--font-figtree, --font-source-serif).
export const figtree = Figtree({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-figtree",
});

export const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-source-serif",
});
