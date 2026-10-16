"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { cn, initials, userName } from "@/lib/utils";
import { Heart, MapPin, MessageCircle, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

export const NAV = [
  { href: "/cars", label: "Машин авах" },
  { href: "/sell", label: "Зарах" },
  { href: "/leasing", label: "Лизинг" },
  { href: "/help", label: "Тусламж" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export default function Header() {
  const pathname = usePathname() ?? "/";
  const { user, status } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 md:h-[76px] md:px-10">
        <Link href="/" aria-label="Нүүр">
          <Logo />
        </Link>

        <span className="hidden items-center gap-1.5 text-sm font-medium text-foreground/80 lg:flex">
          <MapPin className="size-4" />
          Улаанбаатар
        </span>

        <nav className="hidden h-full items-stretch gap-7 md:flex">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center border-b-2 pt-0.5 text-[15px] font-medium transition-colors",
                  active ? "border-primary text-primary" : "border-transparent text-foreground/80 hover:text-foreground"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/chat" aria-label="Чат" className="hidden size-11 place-items-center rounded-xl bg-muted hover:bg-border md:grid">
            <MessageCircle className="size-[18px]" />
          </Link>
          <Link href="/saved" aria-label="Хадгалсан" className="grid size-11 place-items-center rounded-xl bg-muted hover:bg-border">
            <Heart className="size-[18px]" />
          </Link>
          {status === "authenticated" && user ? (
            <Link href="/profile" className="hidden h-11 items-center gap-2 rounded-xl bg-muted pl-1.5 pr-3 hover:bg-border md:flex">
              <span className="grid size-8 place-items-center rounded-lg bg-dark text-xs font-bold text-white">{initials(userName(user))}</span>
              <span className="max-w-32 truncate text-sm font-semibold">{user.firstname || userName(user)}</span>
            </Link>
          ) : (
            <Link href="/login" className="hidden h-11 items-center rounded-xl bg-muted px-4 text-sm font-semibold hover:bg-border md:flex">
              Нэвтрэх
            </Link>
          )}
          <Link
            href="/sell"
            className="hidden h-11 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-bold text-white hover:bg-primary-hover md:flex"
          >
            <Plus className="size-4" strokeWidth={2.6} />
            Зар нэмэх
          </Link>
        </div>
      </div>
    </header>
  );
}
