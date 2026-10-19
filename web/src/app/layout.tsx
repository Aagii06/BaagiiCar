import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { FavoritesProvider } from "@/lib/favorites/FavoritesProvider";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import { getLocale } from "@/lib/i18n/server";
import { translate } from "@/lib/i18n/translate";
import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"], display: "swap" });

// Condensed display face for uppercase titles.
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin", "cyrillic"], display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    title: { default: `Baagii Car Dealer — ${translate(locale, "Машин авах, зарах")}`, template: "%s · Baagii Car Dealer" },
    description: translate(locale, "Монголын машин авах, зарах платформ. Оношилгоотой зар, зээлийн тооцоолуур, зарлагчтай шууд холбогдох."),
  };
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${inter.variable} ${oswald.variable}`}>
      <body className="font-sans antialiased">
        <I18nProvider locale={locale}>
          <AuthProvider>
            <FavoritesProvider>
              <Header />
              <main className="min-h-[60vh]">{children}</main>
              <Footer />
              {/* Room for the mobile tab bar. */}
              <div className="h-[calc(4.5rem+env(safe-area-inset-bottom))] bg-dark md:hidden" />
              <MobileNav />
            </FavoritesProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
