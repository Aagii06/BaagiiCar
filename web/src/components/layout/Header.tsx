"use client";

import { LANGUAGE_SWITCHING } from "@/lib/i18n/config";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { ArrowLeft, Heart } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense } from "react";
import AccountMenu from "./AccountMenu";
import DealersMenu from "./DealersMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import LocationPicker from "./LocationPicker";
import Logo from "./Logo";

export const NAV: { href: string; label: MessageKey }[] = [
  { href: "/cars", label: "Машин авах" },
  { href: "/compare", label: "Харьцуулалт" },
  { href: "/help", label: "Тусламж" },
  { href: "/dealers", label: "Дилерүүд" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Bottom-bar tabs: the phone app bar shows their title, no back arrow. */
const TAB_TITLES: Record<string, MessageKey> = {
  "/cars": "Машин хайх",
  "/compare": "Харьцуулалт",
  "/profile": "Профайл",
};

/** Titles for pages opened from a tab; the phone app bar adds a back arrow. */
const PAGE_TITLES: [prefix: string, title: MessageKey][] = [
  ["/cars/", "Дэлгэрэнгүй"],
  ["/saved", "Хадгалсан"],
  ["/messages", "Мессеж"],
  ["/help", "Тусламж"],
  ["/dealers", "Дилерүүд"],
  ["/leasing", "Лизинг"],
  ["/login", "Нэвтрэх"],
];

/** Phones: a 56px app bar — logo on home, title on tabs, back arrow + title elsewhere. */
function MobileAppBar({ pathname }: { pathname: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const tab = pathname === "/" ? null : TAB_TITLES[pathname];
  const page = pathname === "/" || tab ? undefined : PAGE_TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1];
  const sub = pathname !== "/" && !tab;

  return (
    <div className="flex h-14 items-center gap-1 px-1.5 md:hidden">
      {sub ? (
        <button
          type="button"
          // Opened straight from a link: nothing to go back to, so go home.
          onClick={() => (window.history.length > 1 ? router.back() : router.push("/"))}
          aria-label={t("Буцах")}
          className="grid size-11 place-items-center rounded-full active:bg-muted"
        >
          <ArrowLeft className="size-[22px]" />
        </button>
      ) : null}
      {pathname === "/" ? (
        <Link href="/" aria-label={t("Нүүр")} className="px-2.5">
          <Logo />
        </Link>
      ) : (
        <h1 className={cn("min-w-0 flex-1 truncate text-lg font-bold", !sub && "px-2.5")}>{tab || page ? t((tab ?? page)!) : ""}</h1>
      )}
      <Link href="/saved" aria-label={t("Хадгалсан")} className="ml-auto grid size-11 shrink-0 place-items-center rounded-full active:bg-muted">
        <Heart className="size-[22px]" />
      </Link>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname() ?? "/";
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <MobileAppBar pathname={pathname} />
      <div className="mx-auto hidden h-[76px] max-w-[1280px] items-center gap-6 px-10 md:flex">
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
            const className = cn(
              "flex items-center border-b-2 pt-0.5 text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors",
              active ? "border-primary text-primary" : "border-transparent text-foreground/75 hover:text-foreground"
            );
            if (item.href === "/dealers") return <DealersMenu key={item.href} className={className} />;
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={className}>
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
