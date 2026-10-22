"use client";

import PanelShell from "@/components/layout/PanelShell";
import SplashScreen from "@/components/layout/SplashScreen";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Client-side guard: the token lives in localStorage. The backend still
// checks the admin role on every request.
export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") {
      const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/login${next}`);
    }
  }, [status, pathname, router]);

  // Splash while the session is checked, and while an anonymous visitor is sent to /login.
  if (status !== "authenticated") return <SplashScreen />;
  return <PanelShell>{children}</PanelShell>;
}
