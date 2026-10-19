"use client";

import Container from "@/components/common/Container";
import RequireAuth from "@/components/common/RequireAuth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { initials, userName } from "@/lib/utils";
import { Heart, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function Profile() {
  const { user, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  return (
    <Container className="max-w-[960px] pt-8 md:pt-12">
      <section className="flex flex-wrap items-center gap-4 rounded-2xl bg-card p-5 md:p-6">
        <span className="grid size-14 place-items-center rounded-2xl bg-dark text-lg font-bold text-white">{initials(userName(user))}</span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{userName(user)}</h1>
          <p className="text-sm text-muted-foreground">{[user?.phonenumber, user?.email].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/saved" className="flex items-center gap-1.5 rounded-xl bg-muted px-3.5 py-2.5 text-sm font-bold hover:bg-border">
            <Heart className="size-4" />
            {t("Хадгалсан")}
          </Link>
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="flex items-center gap-1.5 rounded-xl bg-muted px-3.5 py-2.5 text-sm font-bold hover:bg-border"
          >
            <LogOut className="size-4" />
            {t("Гарах")}
          </button>
        </div>
      </section>
    </Container>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Profile />
    </RequireAuth>
  );
}
