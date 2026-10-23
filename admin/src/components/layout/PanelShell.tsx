"use client";

import { ConfirmProvider } from "@/components/common/Confirm";
import { ToastProvider } from "@/components/common/Toast";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "./BrandMark";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import { isActivePath, NAV_ITEMS } from "./nav";

// Tab pages get the brand header and bottom nav; detail pages bring their
// own back-button header instead.
const TAB_PATHS = new Set(NAV_ITEMS.map((item) => item.href));

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isTabPage = TAB_PATHS.has(pathname);
  const isAdmin = useAuth().user?.role === ROLES.admin;
  const navItems = NAV_ITEMS.filter((item) => isAdmin || !item.adminOnly);
  const action = navItems.find((item) => item.href === pathname)?.action;

  return (
    <ToastProvider aboveNav={isTabPage}>
      <ConfirmProvider>
      {isTabPage && (
        <header className="sticky top-0 z-30 flex min-h-[61px] items-center justify-between gap-3 border-b border-border bg-white/95 px-4 py-3 backdrop-blur">
          <Link href="/" aria-label="Самбар">
            <BrandMark />
          </Link>
          {action && (
            <Link href={action.href} className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white hover:bg-primary-hover">
              <Plus className="size-4" strokeWidth={2.6} />
              {action.label}
            </Link>
          )}
        </header>
      )}

      <main className={cn("min-w-0 px-4", isTabPage ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : "pb-10")}>{children}</main>

      {isTabPage && (
        <nav aria-label="Үндсэн цэс" className="fixed inset-x-0 bottom-0 z-30">
          <div className="relative mx-auto max-w-md">
            {/* Bar background with a curved notch cut out for the + button; drop-shadow draws the top border along the curve. */}
            <div aria-hidden className="absolute inset-0 flex flex-col [filter:drop-shadow(0_-1px_0_var(--color-border))_drop-shadow(0_-4px_12px_rgb(0_0_0/0.04))]">
              <div className="flex h-8">
                <div className="flex-1 bg-white" />
                <svg viewBox="0 0 96 32" className="-mx-px h-8 w-[98px] shrink-0 fill-white">
                  <path d="M0 0H8C14 0 15 4 16 8A34 34 0 0 0 80 8C81 4 82 0 88 0H96V32H0Z" />
                </svg>
                <div className="flex-1 bg-white" />
              </div>
              <div className="-mt-px flex-1 bg-white" />
            </div>

            <div className="relative flex pb-[env(safe-area-inset-bottom)]">
              {navItems.flatMap(({ href, label, icon: Icon }, i) => {
                const active = isActivePath(pathname, href);
                const tab = (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn("flex flex-1 flex-col items-center gap-1 pb-2.5 pt-3 text-[11px] font-semibold", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                  >
                    <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
                    {label}
                  </Link>
                );
                // Three tabs either side; the middle slot sits under the notch.
                return i === Math.floor(navItems.length / 2) ? [<div key="notch" className="w-24 shrink-0" />, tab] : [tab];
              })}
            </div>

            <Link
              href="/cars/new"
              aria-label="Зар нэмэх"
              className="absolute -top-8 left-1/2 grid size-14 -translate-x-1/2 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:bg-primary-hover active:scale-95"
            >
              <Plus className="size-7" strokeWidth={2.6} />
            </Link>
          </div>
        </nav>
      )}
      </ConfirmProvider>
    </ToastProvider>
  );
}
