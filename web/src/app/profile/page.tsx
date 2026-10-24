"use client";

import Container, { AccountTitle } from "@/components/common/Container";
import { Field, inputClass } from "@/components/common/Field";
import { LoadingState } from "@/components/common/States";
import { sendEmailCode, updateMe, verifyEmailCode, type WebUser } from "@/lib/api/auth";
import ProfileSidebar from "@/components/layout/ProfileSidebar";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Check, LogOut, X } from "lucide-react";
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

const EMAIL_CODE_LENGTH = 6;

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
            placeholder="name@example.com"
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
    </form>
  );
}

/** Modal for the 6-digit code e-mailed to the new address; the address is saved once the code checks out. */
function EmailCodeDialog({
  email,
  token,
  onClose,
  onVerified,
}: {
  email: string;
  token: string;
  onClose: () => void;
  onVerified: (user: WebUser) => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The code was just sent before the modal opened.
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

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

  // Filling in the last digit checks the code; a wrong one is cleared for another try.
  const verify = (value: string) =>
    run(async () => {
      try {
        onVerified(await verifyEmailCode(token, email, value));
      } catch (err) {
        setCode("");
        throw err;
      }
    });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      {/* A div, not a form: this sits inside the profile form. */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-code-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full space-y-4 rounded-t-2xl bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="email-code-title" className="text-lg font-bold">
            {t("И-мэйл баталгаажуулах")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("Хаах")} className="-m-2 grid size-10 place-items-center rounded-full hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{t("{email} хаяг руу илгээсэн 6 оронтой кодыг оруулна уу.", { email })}</p>
        <Field label={t("Баталгаажуулах код")}>
          <input
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, EMAIL_CODE_LENGTH);
              setCode(next);
              if (next.length === EMAIL_CODE_LENGTH) verify(next);
            }}
            // Enter would submit the profile form behind the modal.
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            // readOnly, not disabled, so the field keeps focus for a retry.
            readOnly={busy}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            autoFocus
            className={cn(inputClass, "text-center text-xl font-bold tracking-[0.5em]")}
          />
        </Field>
        {error && <p className="rounded-xl bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">{error}</p>}
        <div className="flex items-center justify-between gap-4 text-sm font-semibold">
          <span className="text-muted-foreground">{busy && code.length === EMAIL_CODE_LENGTH ? t("Шалгаж байна…") : ""}</span>
          <button
            type="button"
            onClick={() =>
              run(async () => {
                await sendEmailCode(token, email);
                setCode("");
                setCooldown(60);
              })
            }
            disabled={busy || cooldown > 0}
            className="text-primary disabled:opacity-60"
          >
            {cooldown > 0 ? t("Код дахин авах ({n})", { n: cooldown }) : t("Код дахин авах")}
          </button>
        </div>
      </section>
    </div>
  );
}
