"use client";

import PageHeader from "@/components/layout/PageHeader";
import { WEB_URL } from "@/lib/api/config";
import { useAuth } from "@/lib/auth/AuthProvider";
import { roleLabel } from "@/lib/constants";
import { initials, userName } from "@/lib/utils";
import { ChevronRight, ExternalLink, LogOut } from "lucide-react";
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
