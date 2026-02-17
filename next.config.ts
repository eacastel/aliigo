import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

// 1. Initialize the next-intl plugin
const withNextIntl = createNextIntlPlugin(
  './src/i18n/request.ts'
);

const NEXT_PUBLIC_EMBED_ALLOW =
  process.env.NEXT_PUBLIC_EMBED_ALLOW ??
  "https://aliigo.com https://www.aliigo.com http://localhost:3000";

// 2. Your existing config stays exactly the same
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

  async redirects() {
    return [];
  },
};

// 3. Export using the wrapper
export default withNextIntl(nextConfig);
