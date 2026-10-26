"use client";

import { LoadingState } from "@/components/common/States";
import { useAuth } from "@/lib/auth/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Open without signing in: the login form itself and the unsubscribe link from emails.
const PUBLIC_PATHS = ["/login", "/unsubscribe"];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Until a phone number is signed in, only the login page is shown — no header, footer or other pages. */
export default function AuthGate({ header, chrome, children }: { header: React.ReactNode; chrome: React.ReactNode; children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const open = isPublic(pathname);

  useEffect(() => {
    if (ready && !user && !open) {
      const next = pathname + window.location.search;
      router.replace(next === "/" ? "/login" : `/login?next=${encodeURIComponent(next)}`);
    }
  }, [ready, user, open, pathname, router]);

  if (!ready) return <LoadingState className="min-h-screen" />;
  if (!user) return open ? <main className="min-h-screen">{children}</main> : <LoadingState className="min-h-screen" />;
  return (
    <>
      {header}
      <main className="min-h-[60vh]">{children}</main>
      {chrome}
    </>
  );
}
