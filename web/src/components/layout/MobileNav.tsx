"use client";

import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { GitCompare, Home, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive } from "./Header";

const TABS: { href: string; label: MessageKey; icon: typeof Home }[] = [
  { href: "/", label: "Нүүр", icon: Home },
  { href: "/cars", label: "Хайх", icon: Search },
  { href: "/compare", label: "Харьцуулалт", icon: GitCompare },
  { href: "/profile", label: "Профайл", icon: User },
];

/** App-style (Material 3) bottom navigation bar; hidden from `md` up. */
export default function MobileNav() {
  const pathname = usePathname() ?? "/";
  const { t } = useI18n();
  return (
    <nav aria-label={t("Үндсэн цэс")} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] select-none md:hidden">
      <div className="grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn("flex flex-col items-center gap-1 pb-2.5 pt-3 text-[11px] font-semibold", active ? "text-foreground" : "text-muted-foreground")}
            >
              {/* Active-indicator pill behind the icon. */}
              <span className={cn("grid h-8 w-16 place-items-center rounded-full transition-colors", active && "bg-primary-soft text-primary")}>
                <Icon className="size-[22px]" strokeWidth={active ? 2.4 : 2} />
              </span>
              <span className="max-w-full truncate px-1">{t(label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
