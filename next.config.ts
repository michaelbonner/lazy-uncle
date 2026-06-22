import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  turbopack: {
    root: path.join(__dirname, ".."),
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },

  skipTrailingSlashRedirect: true,
};

export default nextConfig;
