import type { MetadataRoute } from "next";

// Home Screen install (2026-09-27). Progress lives only in localStorage; Safari wipes a
// site's storage after 7 days without a visit, but a web app ADDED TO THE HOME SCREEN is
// exempt from that purge. This manifest + the appleWebApp metadata in layout.tsx make
// "Share → Add to Home Screen" open full-screen as its own app. Served at /manifest.webmanifest.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Aoife — Which First?",
    short_name: "Which First?",
    description: "Learn the order of operations — brackets, times and plus.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
