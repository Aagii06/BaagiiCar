"use client";

import Container, { AccountTitle } from "@/components/common/Container";
import CodeDialog from "@/components/common/CodeDialog";
import EmailCodeDialog from "@/components/common/EmailCodeDialog";
import { Field, inputClass } from "@/components/common/Field";
import { AccountSkeleton } from "@/components/common/States";
import { sendEmailCode, sendPhoneVerifyCode, updateMe, verifyPhoneCode, type WebUser } from "@/lib/api/auth";
import ProfileSidebar from "@/components/layout/ProfileSidebar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { BadgeCheck, Check, LogOut, ShieldAlert } from "lucide-react";
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

  if (!ready || !user) return <AccountSkeleton />;

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
  // New address waiting for its e-mailed code (the modal is open while set).
  const [verifying, setVerifying] = useState<string | null>(null);
  // SMS code sent to the account's phone (the modal is open while true).
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const phoneVerified = Boolean(user.phone_verified_at);
  const savedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(savedTimer.current), []);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  const nameDirty = trimmedName !== (user.firstname ?? "");
  const emailDirty = trimmedEmail !== (user.email ?? "").toLowerCase();
  const emailRemoved = emailDirty && !trimmedEmail;
  // A new address is saved through its code (the "Код авах" button), not this button.
  const canSave = !busy && (nameDirty || emailRemoved) && trimmedName.length > 0;
  const canRequestCode = !busy && emailDirty && /^\S+@\S+\.\S+$/.test(trimmedEmail);

  const showSaved = () => {
    setSaved(true);
    clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaved(false), 2000);
  };

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // Name (and a removed e-mail) save here.
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave || !token) return;
    run(async () => {
      setUser(await updateMe(token, { firstname: trimmedName, ...(emailRemoved ? { email: null } : {}) }));
      showSaved();
    });
  };

  // New e-mail: code to that address, then the modal saves it once the code is filled in.
  const requestCode = () => {
    if (!canRequestCode || !token) return;
    run(async () => {
      await sendEmailCode(token, trimmedEmail);
      setVerifying(trimmedEmail);
    });
  };

  // Unverified phone: SMS code to the account's number, then the modal confirms it.
  const requestPhoneCode = () => {
    if (busy || !token) return;
    run(async () => {
      await sendPhoneVerifyCode(token);
      setVerifyingPhone(true);
    });
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
      <Field
        label={t("Утасны дугаар")}
        hint={
          phoneVerified
            ? t("Утасны дугаараар нэвтэрдэг тул өөрчлөх боломжгүй.")
            : user.phone_verify_deadline
              ? t("Утасны дугаараа баталгаажуулна уу. {date} хүртэл баталгаажуулаагүй бол бүртгэл устна.", { date: user.phone_verify_deadline.slice(0, 16) })
              : t("Утасны дугаараа баталгаажуулна уу.")
        }
      >
        <span className="relative block">
          <input value={user.phonenumber ?? ""} disabled readOnly className={cn(inputClass, phoneVerified ? "pr-10" : "pr-36")} />
          {phoneVerified ? (
            <BadgeCheck aria-label={t("Баталгаажсан")} className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-success" />
          ) : (
            <button
              type="button"
              onClick={requestPhoneCode}
              disabled={busy}
              className="absolute right-1.5 top-1/2 flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-60"
            >
              <ShieldAlert className="size-4" />
              {t("Баталгаажуулах")}
            </button>
          )}
        </span>
      </Field>
      <Field label={t("И-мэйл")} hint={emailDirty && trimmedEmail ? t("Шинэ хаяг руу баталгаажуулах код илгээнэ.") : undefined}>
        <span className="relative block">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              // Enter on a new address asks for its code instead of submitting the form.
              if (e.key !== "Enter" || !emailDirty || !trimmedEmail) return;
              e.preventDefault();
              requestCode();
            }}
            placeholder={t("И-мэйл хаяг")}
            autoComplete="email"
            className={cn(inputClass, emailDirty && trimmedEmail && "pr-28")}
          />
          {emailDirty && trimmedEmail && (
            <button
              type="button"
              onClick={requestCode}
              disabled={!canRequestCode}
              className="absolute right-1.5 top-1/2 h-9 -translate-y-1/2 rounded-lg bg-primary px-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:opacity-60"
            >
              {t("Код авах")}
            </button>
          )}
        </span>
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

      {verifying && token && (
        <EmailCodeDialog
          email={verifying}
          token={token}
          onClose={() => setVerifying(null)}
          onVerified={(next) => {
            setVerifying(null);
            setUser(next);
            showSaved();
          }}
        />
      )}
      {verifyingPhone && token && (
        <CodeDialog
          title={t("Утас баталгаажуулах")}
          description={t("{phone} дугаар руу илгээсэн 4 оронтой кодыг оруулна уу.", { phone: user.phonenumber ?? "" })}
          length={4}
          resend={() => sendPhoneVerifyCode(token)}
          verify={(code) => verifyPhoneCode(token, code)}
          onClose={() => setVerifyingPhone(false)}
          onVerified={(next) => {
            setVerifyingPhone(false);
            setUser(next);
            showSaved();
          }}
        />
      )}
    </form>
  );
}
