import { createAuthClient } from "better-auth/react";

export const getURL = () => {
  const url =
    (process.env.NEXT_PUBLIC_EXPORT == "true"
      ? process.env.NEXT_PUBLIC_BASE_URL // Set this to production URL in all envs. (For output: "export")
      : process.env.NEXT_PUBLIC_SITE_URL || // Set this to your site URL in production env only. (Production)
        process.env.NEXT_PUBLIC_VERCEL_URL) || // Automatically set by Vercel. (Preview)
    "http://localhost:3000"; // Default to localhost. (Development)

  // Make sure to include `https://` when not localhost.
  return url.includes("http") ? url : `https://${url}`;
};

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: getURL(),
});

export type Session = typeof authClient.$Infer.Session;
