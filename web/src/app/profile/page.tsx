"use client";

import Container, { PageTitle } from "@/components/common/Container";
import { LoadingState } from "@/components/common/States";
import { displayName, useAuth } from "@/lib/auth/AuthProvider";
import { useCompare } from "@/lib/compare/CompareProvider";
import { useFavorites } from "@/lib/favorites/FavoritesProvider";
import { getUnreadCount } from "@/lib/api/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ChevronRight, GitCompare, Heart, LifeBuoy, LogOut, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Signed-in visitor's page (the mobile tab bar's last tab); not signed in → the phone-code login. */
export default function ProfilePage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, token, ready, signOut } = useAuth();
  // Team answers not opened yet, for the "Мессеж" badge.
  const unread = useApi(
    async () => (token ? getUnreadCount(token) : 0),
    token ?? ""
  );
  const favorites = useFavorites();
  const compare = useCompare();

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/profile");
  }, [ready, user, router]);

  if (!ready || !user) return <LoadingState className="min-h-[50vh]" />;

  const links = [
    { href: "/messages", label: t("Мессеж"), icon: MessageCircle, count: unread.data ?? 0, alert: true },
    { href: "/saved", label: t("Хадгалсан"), icon: Heart, count: favorites.ids.size },
    { href: "/compare", label: t("Харьцуулалт"), icon: GitCompare, count: compare.ids.length },
    { href: "/help", label: t("Тусламж"), icon: LifeBuoy },
  ];

  return (
    <Container className="max-w-xl pt-4 md:pt-12">
      <PageTitle>{t("Миний бүртгэл")}</PageTitle>

      <section className="flex md:mt-6 items-center gap-4 rounded-2xl bg-card p-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <User className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{displayName(user)}</p>
          {user.phonenumber && <p className="text-sm text-muted-foreground">{user.phonenumber}</p>}
        </div>
      </section>

      <nav className="mt-3 overflow-hidden rounded-2xl bg-card">
        {links.map(({ href, label, icon: Icon, count, alert }) => (
          <Link key={href} href={href} className="flex items-center gap-3 border-b border-border px-5 py-4 font-semibold last:border-b-0 hover:bg-muted">
            <Icon className="size-5 text-muted-foreground" />
            <span className="flex-1">{label}</span>
            {!!count && (
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", alert ? "bg-primary text-white" : "bg-primary-soft text-primary")}>{count}</span>
            )}
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => {
          signOut();
          router.replace("/");
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-4 font-semibold text-destructive hover:bg-destructive-soft"
      >
        <LogOut className="size-4" />
        {t("Гарах")}
      </button>
    </Container>
  );
}
