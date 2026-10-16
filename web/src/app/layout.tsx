import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { FavoritesProvider } from "@/lib/favorites/FavoritesProvider";
import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"], display: "swap" });

// Condensed display face for uppercase titles.
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin", "cyrillic"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Baagii Car Dealer — Машин авах, зарах", template: "%s · Baagii Car Dealer" },
  description: "Монголын машин авах, зарах платформ. Оношилгоотой зар, зээлийн тооцоолуур, зарлагчтай шууд холбогдох.",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn" className={`${inter.variable} ${oswald.variable}`}>
      <body className="font-sans antialiased">
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
      </body>
    </html>
  );
}
