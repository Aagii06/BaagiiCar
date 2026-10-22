"use client";

import { LANGUAGE_SWITCHING } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import AccountMenu from "./AccountMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import LocationPicker from "./LocationPicker";
import Logo from "./Logo";

export const NAV: { href: string; label: MessageKey }[] = [
  { href: "/cars", label: "Машин авах" },
  { href: "/leasing", label: "Лизинг" },
  { href: "/help", label: "Тусламж" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname() ?? "/";
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 md:h-[76px] md:px-10">
        <Link href="/" aria-label={t("Нүүр")} className="shrink-0">
          <Logo />
        </Link>

        {/* Reads the URL, so it needs its own Suspense boundary on static pages. */}
        <Suspense fallback={null}>
          <LocationPicker />
        </Suspense>

        <nav className="hidden h-full items-stretch gap-5 whitespace-nowrap md:flex lg:gap-7">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center border-b-2 pt-0.5 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-foreground/75 hover:text-foreground"
                )}
              >
                {t(item.label)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {LANGUAGE_SWITCHING && <LanguageSwitcher />}
          <Link href="/saved" aria-label={t("Хадгалсан")} className="grid size-11 place-items-center rounded-xl bg-muted hover:bg-border">
            <Heart className="size-[18px]" />
          </Link>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
