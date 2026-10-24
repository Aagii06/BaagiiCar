"use client";

import { getUnreadCount } from "@/lib/api/messages";
import { displayName, useAuth } from "@/lib/auth/AuthProvider";
import { useCompare } from "@/lib/compare/CompareProvider";
import { useFavorites } from "@/lib/favorites/FavoritesProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ChevronRight, GitCompare, Heart, LifeBuoy, LogOut, MessageCircle, User, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/** Signed-in user's card + account menu, shared by /profile and the pages it links to. Renders nothing when signed out. */
export default function ProfileSidebar({ className }: { className?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, signOut } = useAuth();
  // Team answers not opened yet, for the "Мессеж" badge.
  const unread = useApi(
    async () => (token ? getUnreadCount(token) : 0),
    token ?? ""
  );
  const favorites = useFavorites();
  const compare = useCompare();

  if (!user) return null;

  const links = [
    { href: "/profile", label: t("Хувийн мэдээлэл"), icon: UserRound },
    { href: "/messages", label: t("Мессеж"), icon: MessageCircle, count: unread.data ?? 0, alert: true },
    { href: "/saved", label: t("Хадгалсан"), icon: Heart, count: favorites.ids.size },
    { href: "/compare", label: t("Харьцуулалт"), icon: GitCompare, count: compare.ids.length },
    { href: "/help", label: t("Тусламж"), icon: LifeBuoy },
  ];

  return (
    <aside className={cn("space-y-3", className)}>
      <section className="flex items-center gap-4 rounded-2xl bg-card p-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
          <User className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{displayName(user)}</p>
          {user.phonenumber && <p className="text-sm text-muted-foreground">{user.phonenumber}</p>}
        </div>
      </section>

      <nav className="overflow-hidden rounded-2xl bg-card">
        {links.map(({ href, label, icon: Icon, count, alert }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 border-b border-border px-5 py-4 font-semibold last:border-b-0",
                active ? "bg-primary-soft text-primary" : "hover:bg-muted"
              )}
            >
              <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
              <span className="flex-1">{label}</span>
              {!!count && (
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", alert ? "bg-primary text-white" : "bg-primary-soft text-primary")}>{count}</span>
              )}
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          );
        })}
      </nav>

      {/* Phones: /profile shows its own sign-out at the end of the page. */}
      <button
        type="button"
        onClick={() => {
          signOut();
          router.replace("/");
        }}
        className="hidden w-full items-center justify-center gap-2 rounded-2xl bg-card py-4 font-semibold text-destructive hover:bg-destructive-soft lg:flex"
      >
        <LogOut className="size-4" />
        {t("Гарах")}
      </button>
    </aside>
  );
}
