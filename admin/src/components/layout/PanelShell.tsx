"use client";

import { ToastProvider } from "@/components/common/Toast";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandMark from "./BrandMark";
import { isActivePath, NAV_ITEMS } from "./nav";

// Tab pages get the brand header and bottom nav; detail pages bring their
// own back-button header instead.
const TAB_PATHS = new Set(NAV_ITEMS.map((item) => item.href));

export default function PanelShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isTabPage = TAB_PATHS.has(pathname);

  return (
    <ToastProvider>
      {isTabPage && (
        <header className="sticky top-0 z-30 border-b border-border bg-white/95 px-4 py-3 backdrop-blur">
          <Link href="/" aria-label="Самбар">
            <BrandMark />
          </Link>
        </header>
      )}

      <main className={cn("min-w-0 px-4", isTabPage ? "pb-[calc(6rem+env(safe-area-inset-bottom))]" : "pb-10")}>{children}</main>

      {isTabPage && (
        <nav aria-label="Үндсэн цэс" className="fixed inset-x-0 bottom-0 z-30">
          <div className="mx-auto grid max-w-md grid-cols-6 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = isActivePath(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn("flex flex-col items-center gap-1 pb-2.5 pt-3 text-[11px] font-semibold", active ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </ToastProvider>
  );
}
