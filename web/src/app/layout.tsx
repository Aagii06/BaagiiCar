import CompareBar from "@/components/car/CompareBar";
import ChatWidget from "@/components/chat/ChatWidget";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import PushPrompt from "@/components/layout/PushPrompt";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { CompareProvider } from "@/lib/compare/CompareProvider";
import { FavoritesProvider } from "@/lib/favorites/FavoritesProvider";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { translate } from "@/lib/i18n/translate";
import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"], display: "swap" });

// Condensed display face for uppercase titles.
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin", "cyrillic"], display: "swap" });

// Static export: rendered once at build time, in the default language.
const locale = DEFAULT_LOCALE;

export const metadata: Metadata = {
  title: { default: `Cardealer — ${translate(locale, "Машин авах, зарах")}`, template: "%s · Cardealer" },
  description: translate(locale, "Монголын машин авах, зарах платформ. Оношилгоотой зар, зээлийн тооцоолуур, зарлагчтай шууд холбогдох."),
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={locale} className={`${inter.variable} ${oswald.variable}`}>
      <body className="font-sans antialiased">
        <I18nProvider locale={locale}>
          <AuthProvider>
            <FavoritesProvider>
              <CompareProvider>
              <Header />
              <main className="min-h-[60vh]">{children}</main>
              <Footer />
              {/* Room for the mobile tab bar. */}
              <div className="h-[calc(4.5rem+env(safe-area-inset-bottom))] bg-dark md:hidden" />
              <MobileNav />
              <ChatWidget />
              <CompareBar />
              <PushPrompt />
              </CompareProvider>
            </FavoritesProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
