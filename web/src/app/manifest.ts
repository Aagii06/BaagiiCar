import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { translate } from "@/lib/i18n/translate";
import type { MetadataRoute } from "next";

// Lets phones install the site to the home screen and open it full-screen, like a native app.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cardealer",
    short_name: "Cardealer",
    description: translate(DEFAULT_LOCALE, "Монголын машин авах, зарах платформ. Оношилгоотой зар, зээлийн тооцоолуур, зарлагчтай шууд холбогдох."),
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: DEFAULT_LOCALE,
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
