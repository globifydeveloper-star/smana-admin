import type { MetadataRoute } from "next";

/**
 * PWA Manifest for SMANA Hotel Admin Panel
 * Served at /manifest.json by Next.js App Router automatically.
 *
 * Key decisions:
 *  - scope: "/" covers the full admin panel
 *  - start_url: "/dashboard" — admins land on dashboard after install, not login
 *  - display: "standalone" — hides browser chrome for native-app feel
 *  - theme/background: matched to the dark admin UI palette
 */
export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "SMANA Hotel Admin",
        short_name: "SMANA Admin",
        description: "Luxury Hotel Administration — Operations Dashboard",
        start_url: "/dashboard",
        scope: "/",
        display: "standalone",
        orientation: "any",
        background_color: "#0f172a", // Slate-900 — matches dark admin theme
        theme_color: "#6366f1",       // Indigo — matches primary accent
        icons: [
            {
                src: "/smana_logo.png",
                sizes: "192x192",
                type: "image/png",
                purpose: "maskable",
            },
            {
                src: "/smana_logo.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any",
            },
        ],
        shortcuts: [
            {
                name: "Dashboard",
                short_name: "Dashboard",
                description: "Go to the main dashboard",
                url: "/dashboard",
            },
            {
                name: "Requests",
                short_name: "Requests",
                description: "View service requests",
                url: "/dashboard/requests",
            },
        ],
        categories: ["productivity", "utilities"],
    };
}
