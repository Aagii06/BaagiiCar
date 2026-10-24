"use client";

import Container, { AccountTitle } from "@/components/common/Container";
import { Field, inputClass } from "@/components/common/Field";
import { LoadingState } from "@/components/common/States";
import { updateMe, type WebUser } from "@/lib/api/auth";
import ProfileSidebar from "@/components/layout/ProfileSidebar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Check, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Signed-in visitor's page (the mobile tab bar's last tab); not signed in → the phone-code login. */
export default function ProfilePage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, ready, signOut } = useAuth();

  useEffect(() => {
    if (ready && !user) router.replace("/login?next=/profile");
  }, [ready, user, router]);

  if (!ready || !user) return <LoadingState className="min-h-[50vh]" />;

  return (
    <Container className="pt-3 md:pt-10">
      <AccountTitle title={t("Миний бүртгэл")} subtitle={t("Хувийн мэдээлэл, мессеж, хадгалсан зарууд")} />

      <div className="grid gap-3 lg:grid-cols-[300px_1fr] lg:items-start lg:gap-5">
        <ProfileSidebar />
        <ProfileForm key={user.id} user={user} />

        {/* Phones: sign-out at the end of the page (desktop has it under the menu). */}
        <button
          type="button"
          onClick={() => {
            signOut();
            router.replace("/");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-4 font-semibold text-destructive hover:bg-destructive-soft lg:hidden"
        >
          <LogOut className="size-4" />
          {t("Гарах")}
        </button>
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
    <form onSubmit={submit} className="max-w-2xl space-y-4 rounded-2xl bg-card p-5 md:p-6">
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
