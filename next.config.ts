// next.config.ts
import type { NextConfig } from "next";

const NEXT_PUBLIC_EMBED_ALLOW =
  process.env.NEXT_PUBLIC_EMBED_ALLOW ??
  "https://horchatalabs.com https://www.horchatalabs.com http://localhost:3000";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  /** Security + embed headers */
  async headers() {
    return [
      // Allow your widget iframe page to be embedded by specific sites
      {
        source: "/embed/chat",
        headers: [
          // Control who can embed this page
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors 'self' ${NEXT_PUBLIC_EMBED_ALLOW};`,
          },
          // Legacy header; harmless for extra compatibility
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },

      // Loosen CORS for your public JSON endpoints (only what you need)
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },

  /**
   * Redirects:
   * For host-level (www → apex) redirects, do this in Vercel → Project → Domains
   * (recommended). If you prefer code, use middleware.ts to inspect the Host header.
   */
  async redirects() {
    return [
      // Example path-level redirects (add any you need)
      // { source: "/old", destination: "/new", permanent: true },
    ];
  },
};

export default nextConfig;
