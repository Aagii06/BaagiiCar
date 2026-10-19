"use client";

import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { CreditCard, Heart, Home, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive } from "./Header";

const TABS: { href: string; label: MessageKey; icon: typeof Home }[] = [
  { href: "/", label: "Нүүр", icon: Home },
  { href: "/cars", label: "Хайх", icon: Search },
  { href: "/leasing", label: "Лизинг", icon: CreditCard },
  { href: "/saved", label: "Хадгалсан", icon: Heart },
];

/** Bottom tab bar from the mobile design; hidden from `md` up. */
export default function MobileNav() {
  const pathname = usePathname() ?? "/";
  const { t } = useI18n();
  return (
    <nav aria-label={t("Үндсэн цэс")} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <div className="grid grid-cols-4">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn("flex flex-col items-center gap-1 pb-2 pt-2.5 text-[11px] font-semibold", active ? "text-primary" : "text-muted-foreground")}
            >
              <Icon className="size-5" strokeWidth={active ? 2.4 : 2} />
              {t(label)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
