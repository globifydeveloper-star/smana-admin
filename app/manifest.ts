import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "SMANA Hotel Admin",
        short_name: "SMANA Admin",
        description: "Luxury Hotel Administration System",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
            {
                src: "/smana_logo.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/smana_logo.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    };
}
