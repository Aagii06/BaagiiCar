"use client";

import PageHeader from "@/components/layout/PageHeader";
import { WEB_URL } from "@/lib/api/config";
import { useAuth } from "@/lib/auth/AuthProvider";
import { roleLabel, ROLES } from "@/lib/constants";
import { initials, userName } from "@/lib/utils";
import { ChevronRight, ExternalLink, LibraryBig, LogOut, Users } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  return (
    <>
      <PageHeader title="Профайл" />
      <section className="flex items-center gap-3 rounded-2xl bg-dark p-4 text-white">
        <span className="grid size-12 place-items-center rounded-xl bg-primary font-bold">{initials(userName(user))}</span>
        <div className="min-w-0">
          <p className="truncate font-bold">{userName(user)}</p>
          <p className="text-sm text-white/70">
            {user?.phonenumber} · {roleLabel(user?.role)}
          </p>
        </div>
      </section>

      {/* Moved out of the bottom nav to keep it at four tabs; admins only. */}
      {user?.role === ROLES.admin && (
        <div className="mt-4 space-y-2">
          <Link href="/catalog" className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 font-semibold">
            <LibraryBig className="size-5 text-muted-foreground" />
            Каталог
            <ChevronRight className="ml-auto size-4" />
          </Link>
          <Link href="/users" className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 font-semibold">
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
