import RequiredFieldMarker from "@/components/common/RequiredFieldMarker";
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
  // iOS "Add to Home Screen": open full-screen without Safari's address bar.
  appleWebApp: { capable: true, title: "Cardealer", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f26a1b",
  viewportFit: "cover",
  // App-like on phones: no page zoom at all (iOS ignores this for pinch, so globals.css also sets touch-action).
  // Photos zoom inside PhotoViewer instead.
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="mn" className={`${inter.variable} ${oswald.variable}`}>
      <body className="bg-[#e4e6ea] font-sans antialiased">
        <AppColumn>
          <RequiredFieldMarker />
          <AuthProvider>{children}</AuthProvider>
        </AppColumn>
      </body>
    </html>
  );
}
