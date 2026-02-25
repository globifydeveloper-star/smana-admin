import type { NextConfig } from "next";

/**
 * Next.js configuration for SMANA Hotel Admin
 *
 * Service Worker is implemented as a plain public/sw.js (no build plugin needed).
 * This avoids WorkerError crashes introduced by next-pwa / @serwist/next
 * when used with Next.js 16 + Turbopack.
 *
 * To upgrade to a compiled SW in the future, you can re-enable serwist here once
 * the library becomes stable with Next.js 16 Turbopack.
 */
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Security headers for the admin panel
        source: "/(.*)",
        headers: [
          // Prevent the admin panel from being embedded in iframes
          { key: "X-Frame-Options", value: "DENY" },
          // Stop browsers from MIME-sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Enable browser XSS filter
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Restrict referrer info leakage
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Service worker scope declaration header
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Serve the service worker with no-cache headers so browsers always check
        // for an updated version on every navigation
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Manifest can be cached briefly — browsers re-check on each install/update
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600" },
          { key: "Content-Type", value: "application/manifest+json" },
        ],
      },
    ];
  },
};

export default nextConfig;
