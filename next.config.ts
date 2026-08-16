import type { NextConfig } from "next";
// Relative path (not `@/`) — the alias isn't resolved in config context; env.ts
// is import-free so this is safe.
import { serverEnv } from "./src/config/env";

const nextConfig: NextConfig = {
  // On Vercel, leave output unset — Vercel handles its own packaging.
  // (The original used `output: "standalone"` for cPanel/PM2.)

  // cacheComponents intentionally OFF. This is a 100%-authenticated, per-request
  // admin app — there is nothing to statically cache, and the feature would force
  // a <Suspense> boundary around every cookies()/session read (build errors
  // otherwise) for no benefit. If a specific public route ever wants PPR, opt that
  // route in rather than carrying the constraint app-wide.

  async rewrites() {
    // Same-origin proxy for the browser. /api/anything → backend.
    // This is what lets `credentials: 'include'` send cookies without
    // touching cross-origin cookie rules.
    //
    // Socket.IO is NOT proxied here: Next's trailing-slash redirect strips the
    // `/socket.io/` slash the handshake needs, so the chat socket connects
    // directly to NEXT_PUBLIC_BACKEND_URL instead (see features/chat/api/
    // chat-socket.ts). The backend's Socket.IO CORS must allowlist the admin
    // origin for that direct connection.
    return [
      {
        source: "/api/:path*",
        destination: `${serverEnv().apiBaseUrl}/:path*`,
      },
    ];
  },

  // The "Products" section was renamed to "Catalogues" (routes moved from
  // /products to /catalogues) and markup/pricing was promoted to a standalone
  // /pricing route. Permanent-redirect the old paths so bookmarks and any stale
  // links still resolve. Order matters — Next uses first-match, so the specific
  // pricing paths must precede the /products/* catch-all.
  async redirects() {
    return [
      { source: "/products/pricing", destination: "/pricing", permanent: true },
      {
        source: "/products/parts/pricing",
        destination: "/pricing?tab=parts",
        permanent: true,
      },
      {
        source: "/products/:path*",
        destination: "/catalogues/:path*",
        permanent: true,
      },
      { source: "/products", destination: "/catalogues", permanent: true },
    ];
  },

  // Tell crawlers we are not for them. (robots.ts is the primary defense;
  // this is belt-and-suspenders for any bot that ignores robots.)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
    ];
  },

  // Hosts admin uploads and avatars are displayed from. Sourced from
  // `IMAGE_ASSET_HOSTS` (comma-separated) with a sensible default in
  // config/env.ts, so a backend that serves images from a different bucket
  // needs an env change, not a code change. Build-time — Next bakes these in.
  images: {
    remotePatterns: serverEnv().imageHosts.map((hostname) => ({
      protocol: "https" as const,
      hostname,
      port: "",
      pathname: "/**",
    })),
  },
};

export default nextConfig;
