"use client";

import Container, { PageTitle } from "@/components/common/Container";
import { Field, inputClass } from "@/components/common/Field";
import { LoadingState } from "@/components/common/States";
import { updateMe, type WebUser } from "@/lib/api/auth";
import { displayName, useAuth } from "@/lib/auth/AuthProvider";
import { useCompare } from "@/lib/compare/CompareProvider";
import { useFavorites } from "@/lib/favorites/FavoritesProvider";
import { getUnreadCount } from "@/lib/api/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, GitCompare, Heart, LifeBuoy, LogOut, MessageCircle, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

  const logout = (
    <button
      type="button"
      onClick={() => {
        signOut();
        router.replace("/");
      }}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-4 font-semibold text-destructive hover:bg-destructive-soft"
    >
      <LogOut className="size-4" />
      {t("Гарах")}
    </button>
  );

  return (
    <Container className="max-w-5xl pt-4 md:pt-12">
      <PageTitle>{t("Миний бүртгэл")}</PageTitle>

      <div className="mt-3 grid gap-3 md:mt-6 lg:grid-cols-[300px_1fr] lg:items-start lg:gap-5">
        <div className="space-y-3">
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

          {/* Desktop: under the menu; phones: at the end of the page. */}
          <div className="hidden lg:block">{logout}</div>
        </div>

        <ProfileForm key={user.id} user={user} />

        <div className="lg:hidden">{logout}</div>
      </div>
    </Container>
  );
}

function ProfileForm({ user }: { user: WebUser }) {
  const { t } = useI18n();
  const { token, setUser } = useAuth();
  const [name, setName] = useState(user.firstname ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const dirty = trimmedName !== (user.firstname ?? "") || trimmedEmail !== (user.email ?? "");
  const canSave = !busy && dirty && trimmedName.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !token) return;
    setBusy(true);
    setError(null);
    try {
      const next = await updateMe(token, { firstname: trimmedName, email: trimmedEmail || null });
      setSaved(true);
      clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 2000);
      setUser(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-5 md:p-6">
      <div>
        <h2 className="text-lg font-bold">{t("Хувийн мэдээлэл")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("Нэр, и-мэйлээ шинэчлэх")}</p>
      </div>

      <Field label={t("Нэр")}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("Нэрээ оруулна уу")} autoComplete="given-name" maxLength={100} className={inputClass} />
      </Field>
      <Field label={t("Утасны дугаар")} hint={t("Утасны дугаараар нэвтэрдэг тул өөрчлөх боломжгүй.")}>
        <input value={user.phonenumber ?? ""} disabled readOnly className={inputClass} />
      </Field>
      <Field label={t("И-мэйл")}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" className={inputClass} />
      </Field>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <button disabled={!canSave} className="h-12 rounded-xl bg-primary px-6 text-[15px] font-bold text-white transition hover:bg-primary-hover disabled:opacity-60">
          {t("Хадгалах")}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm font-semibold text-success">
            <Check className="size-4" />
            {t("Хадгалагдлаа")}
          </span>
        )}
      </div>
    </form>
  );
}
