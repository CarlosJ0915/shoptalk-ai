import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Live demo app: everything is polled at request time, no build-time caching needed.
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
