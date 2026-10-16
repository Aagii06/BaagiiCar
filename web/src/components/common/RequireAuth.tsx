"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "./States";

/** Client-side guard for pages that need a signed-in user. */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname ?? "/")}`);
  }, [status, pathname, router]);

  if (status !== "authenticated") return <LoadingState className="min-h-[50vh]" />;
  return <>{children}</>;
}
