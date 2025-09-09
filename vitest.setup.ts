import * as matchers from "@testing-library/jest-dom/matchers";
import React from "react";
import { expect, vi } from "vitest";

// Make React available globally for JSX
global.React = React;

// Extend vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock window.gtag for analytics
Object.defineProperty(window, "gtag", {
  value: vi.fn(),
  writable: true,
});

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    ...props
  }: {
    src: string;
    alt: string;
    [key: string]: unknown;
  }) => {
    return React.createElement("img", { src, alt, ...props });
  },
}));

// Mock Next.js Head component
vi.mock("next/head", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href:
      | string
      | { pathname?: string; query?: Record<string, unknown>; hash?: string };
    [key: string]: unknown;
  }) => {
    const hrefStr =
      typeof href === "string"
        ? href
        : (href?.pathname ?? "" + (href?.hash ?? ""));
    return React.createElement("a", { href: hrefStr, ...props }, children);
  },
}));
