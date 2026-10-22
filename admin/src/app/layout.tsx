import AppColumn from "@/components/layout/AppColumn";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "cyrillic"], display: "swap" });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin", "cyrillic"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Cardealer Admin", template: "%s · Cardealer Admin" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#f26a1b",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn" className={`${inter.variable} ${oswald.variable}`}>
      <body className="bg-[#e4e6ea] font-sans antialiased">
        <AppColumn>
          <AuthProvider>{children}</AuthProvider>
        </AppColumn>
      </body>
    </html>
  );
}
