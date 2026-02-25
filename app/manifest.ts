import type { MetadataRoute } from "next";

/**
 * PWA Manifest for SMANA Hotel Admin Panel
 * Served at /manifest.json by Next.js App Router automatically.
 *
 * Fixes applied:
 *  - `id` added (avoids "start_url used as id" audit warning)
 *  - Icon sources point to properly-sized PNGs (512×512, 192×192)
 *  - Screenshots added (required for Richer PWA Install UI on desktop + mobile)
 *  - Shortcut icons added (96×96 as required by Chrome audit)
 *  - theme_color updated to indigo to match admin UI
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/dashboard", // Stable app identity. Prevents "id not specified" audit warning.
        name: "SMANA Hotel Admin",
        short_name: "SMANA Admin",
        description: "Luxury Hotel Administration — Operations Dashboard",
        start_url: "/dashboard",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#0f172a",
        theme_color: "#6366f1",

        // -------------------------------------------------------------------------
        // Icons — actual sizes must match what is declared here.
        // Files generated via generate-pwa-assets.mjs (properly sized PNGs).
        // -------------------------------------------------------------------------
        icons: [
            {
                src: "/icon-96.png",
                sizes: "96x96",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icon-192.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "any",
            },
            {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                // "maskable" = browser can apply shape mask (rounded, circle, etc.)
                purpose: "maskable",
            },
            {
                src: "/icon-512.png",
                sizes: "512x512",
                type: "image/png",
                // Separate entry with purpose "any" so Chrome uses it for the install banner
                purpose: "any",
            },
        ],

        // -------------------------------------------------------------------------
        // Screenshots — required for "Richer PWA Install UI" on Chrome 119+
        //  - At least one with form_factor "wide"  → desktop install UI
        //  - At least one with form_factor "narrow" → mobile install UI
        // -------------------------------------------------------------------------
        screenshots: [
            {
                src: "/screenshot-desktop.png",
                sizes: "1280x720",
                type: "image/png",
                form_factor: "wide",
                label: "SMANA Admin Dashboard on Desktop",
            },
            {
                src: "/screenshot-mobile.png",
                sizes: "390x844",
                type: "image/png",
                form_factor: "narrow",
                label: "SMANA Admin on Mobile",
            },
        ],

        // -------------------------------------------------------------------------
        // Shortcuts — appear in the long-press / right-click install icon menu.
        // Each shortcut must include a 96×96 icon (Chrome audit requirement).
        // -------------------------------------------------------------------------
        shortcuts: [
            {
                name: "Dashboard",
                short_name: "Dashboard",
                description: "Go to the main dashboard",
                url: "/dashboard",
                icons: [{ src: "/icon-96.png", sizes: "96x96", type: "image/png" }],
            },
            {
                name: "Requests",
                short_name: "Requests",
                description: "View service requests",
                url: "/dashboard/requests",
                icons: [{ src: "/icon-96.png", sizes: "96x96", type: "image/png" }],
            },
        ],

        categories: ["productivity", "utilities"],
    };
}
