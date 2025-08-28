import { vi } from "vitest";
import React from "react";

// Mock window.gtag for analytics
Object.defineProperty(window, "gtag", {
  value: vi.fn(),
  writable: true,
});

// Mock Next.js Image component
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: any) => {
    return React.createElement("img", { src, alt, ...props });
  },
}));

// Mock Next.js Head component
vi.mock("next/head", () => ({
  default: ({ children }: any) => children,
}));

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: any) =>
    React.createElement("a", { href, ...props }, children),
}));
