"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { roleLabel, ROLES } from "@/lib/constants";
import UserAvatar from "@/components/common/UserAvatar";
import InstallAppButton from "@/components/profile/InstallAppButton";
import { getDealers } from "@/lib/api/admin";
import { useApi } from "@/lib/useApi";
import { userName } from "@/lib/utils";
import { tr } from "@/lib/i18n/translations";
import { APP_CUSTOMER_URL, useInApp } from "@/lib/inApp";
import { ArrowLeftRight, ChevronRight, KeyRound, LibraryBig, LogOut, MessageSquareText, Pencil, ShieldUser, Store, Users, type LucideIcon } from "lucide-react";
import Link from "next/link";

/** Admin sections, moved out of the bottom nav to keep it at four tabs. Labels are Mongolian keys for tr(). */
const ADMIN_MENU: { href: string; label: string; desc: string; icon: LucideIcon; tone: string }[] = [
  { href: "/catalog", label: "Каталог", desc: "Үйлдвэр, загвар, төрөл, байршил", icon: LibraryBig, tone: "bg-amber-100 text-amber-600 ring-amber-200" },
  { href: "/dealers", label: "Дилерүүд", desc: "Авто худалдааны төвүүдийг бүртгэх, засах", icon: Store, tone: "bg-sky-100 text-sky-600 ring-sky-200" },
  { href: "/users", label: "Admin & Dealer", desc: "Админ, дилерийн хэрэглэгчид", icon: ShieldUser, tone: "bg-violet-100 text-violet-600 ring-violet-200" },
  { href: "/customers", label: "Хэрэглэгч", desc: "Вэбээр бүртгүүлсэн хэрэглэгчид", icon: Users, tone: "bg-emerald-100 text-emerald-600 ring-emerald-200" },
  { href: "/feedbacks", label: "Санал хүсэлт", desc: "Вэбийн “Бидэнд бичих” маягтаар ирсэн захидал", icon: MessageSquareText, tone: "bg-rose-100 text-rose-600 ring-rose-200" },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const inApp = useInApp();
  const dealers = useApi(getDealers);
  const dealer = dealers.data?.find((d) => d.id === user?.dealer_id);

  return (
    <>
      <section className="mt-4 flex items-center gap-3 rounded-2xl bg-linear-to-br from-primary-soft via-orange-50 to-amber-100 p-4 text-foreground ring-1 ring-orange-200/70">
        <UserAvatar user={user} className="size-12 bg-primary text-white shadow-md shadow-primary/30" />
        <div className="min-w-0">
          <p className="truncate font-bold">{user?.firstname || userName(user)}</p>
          <p className="text-sm text-muted-foreground">
            {user?.phonenumber} · {roleLabel(user?.role)}
          </p>
          {dealer && <p className="truncate text-sm font-semibold text-primary">{dealer.name}</p>}
        </div>
        <div className="ml-auto flex shrink-0 gap-2">
          <Link href="/profile/edit" aria-label={tr("Профайл засах")} title={tr("Профайл засах")} className="grid size-10 place-items-center rounded-xl bg-white/80 text-primary shadow-sm hover:bg-white">
            <Pencil className="size-4" />
          </Link>
          <Link href="/profile/password" aria-label={tr("Нууц үг солих")} title={tr("Нууц үг солих")} className="grid size-10 place-items-center rounded-xl bg-white/80 text-primary shadow-sm hover:bg-white">
            <KeyRound className="size-4" />
          </Link>
        </div>
      </section>

      {user?.role === ROLES.admin && (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-2xl bg-card">
          {ADMIN_MENU.map(({ href, label, desc, icon: Icon, tone }) => (
            <li key={href}>
              <Link href={href} className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/60 active:bg-muted">
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset transition-transform group-hover:scale-105 ${tone}`}>
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0 grow">
                  <span className="block truncate text-[15px] font-bold">{tr(label)}</span>
                  <span className="block truncate text-sm text-muted-foreground">{tr(desc)}</span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 space-y-2">
        <InstallAppButton />
        {inApp && (
          <a href={`${APP_CUSTOMER_URL}?admin=1`} className="flex items-center justify-between rounded-2xl bg-card px-4 py-3.5 font-semibold">
            {tr("Хэрэглэгч рүү шилжих")}
            <ArrowLeftRight className="size-4" />
          </a>
        )}
        <button onClick={logout} className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3.5 font-semibold text-destructive">
          {tr("Гарах")}
          <LogOut className="size-4" />
        </button>
      </div>
    </>
  );
}
