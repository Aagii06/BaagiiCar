import type { MetadataRoute } from "next";

// Lets staff install the admin panel to the home screen and open it full-screen, like a native app.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cardealer Admin",
    short_name: "Cardealer",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#e4e6ea",
    theme_color: "#f26a1b",
    lang: "mn",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
