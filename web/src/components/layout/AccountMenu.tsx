"use client";

import { displayName, useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Header slot: "sign in" link, or the signed-in user's menu with sign-out. */
export default function AccountMenu() {
  const { t } = useI18n();
  const pathname = usePathname() ?? "/";
  const { user, ready, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  // Same footprint while the stored session loads, so the header doesn't shift.
  if (!ready) return <span className="size-11 rounded-xl bg-muted" aria-hidden />;

  if (!user) {
    const href = pathname === "/login" ? "/login" : `/login?next=${encodeURIComponent(pathname)}`;
    return (
      <Link href={href} className="flex h-11 items-center gap-2 rounded-xl bg-muted px-3 text-sm font-semibold hover:bg-border sm:px-4">
        <User className="size-[18px]" />
        <span className="hidden sm:inline">{t("Нэвтрэх")}</span>
      </Link>
    );
  }

  const name = displayName(user);
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("Миний бүртгэл")}
        aria-expanded={open}
        className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary hover:bg-primary/15"
      >
        <User className="size-[18px]" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-border bg-white p-2 shadow-lg">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground">{t("Миний бүртгэл")}</p>
            <p className="truncate text-sm font-semibold">{name}</p>
          </div>
          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive-soft"
          >
            <LogOut className="size-4" />
            {t("Гарах")}
          </button>
        </div>
      )}
    </div>
  );
}
