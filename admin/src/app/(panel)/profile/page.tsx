"use client";

import { WEB_URL } from "@/lib/api/config";
import { useAuth } from "@/lib/auth/AuthProvider";
import { roleLabel, ROLES } from "@/lib/constants";
import UserAvatar from "@/components/common/UserAvatar";
import InstallAppButton from "@/components/profile/InstallAppButton";
import { getDealers } from "@/lib/api/admin";
import { useApi } from "@/lib/useApi";
import { userName } from "@/lib/utils";
import { ChevronRight, ExternalLink, LibraryBig, LogOut, Pencil, ShieldUser, Store, Users } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const dealers = useApi(getDealers);
  const dealer = dealers.data?.find((d) => d.id === user?.dealer_id);

  return (
    <>
      <section className="mt-4 flex items-center gap-3 rounded-2xl bg-dark p-4 text-white">
        <UserAvatar user={user} className="size-12 bg-primary text-white" />
        <div className="min-w-0">
          <p className="truncate font-bold">{userName(user)}</p>
          <p className="text-sm text-white/70">
            {user?.phonenumber} · {roleLabel(user?.role)}
          </p>
          {dealer && <p className="truncate text-sm font-semibold text-white">{dealer.name}</p>}
        </div>
        <Link href="/profile/edit" aria-label="Профайл засах" title="Профайл засах" className="ml-auto grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 hover:bg-white/20">
          <Pencil className="size-4" />
        </Link>
      </section>

      {/* Moved out of the bottom nav to keep it at four tabs; admins only. */}
      {user?.role === ROLES.admin && (
        <div className="mt-4 space-y-2">
          <Link href="/catalog" className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 font-semibold">
            <LibraryBig className="size-5 text-muted-foreground" />
            Каталог
            <ChevronRight className="ml-auto size-4" />
          </Link>
          <Link href="/dealers" className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 font-semibold">
            <Store className="size-5 text-muted-foreground" />
            Дилерүүд
            <ChevronRight className="ml-auto size-4" />
          </Link>
          <Link href="/users" className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 font-semibold">
            <ShieldUser className="size-5 text-muted-foreground" />
            Admin &amp; Dealer
            <ChevronRight className="ml-auto size-4" />
          </Link>
          <Link href="/customers" className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 font-semibold">
            <Users className="size-5 text-muted-foreground" />
            Хэрэглэгч
            <ChevronRight className="ml-auto size-4" />
          </Link>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <Link href="/profile/password" className="flex items-center justify-between rounded-2xl bg-card px-4 py-3.5 font-semibold">
          Нууц үг солих
          <ChevronRight className="size-4" />
        </Link>
        <InstallAppButton />
        {WEB_URL && (
          <a href={WEB_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-card px-4 py-3.5 font-semibold">
            Вэб сайт нээх
            <ExternalLink className="size-4" />
          </a>
        )}
        <button onClick={logout} className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3.5 font-semibold text-destructive">
          Гарах
          <LogOut className="size-4" />
        </button>
      </div>
    </>
  );
}
