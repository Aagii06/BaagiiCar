"use client";

import Container from "@/components/common/Container";
import { Field, inputClass, PhoneInput } from "@/components/common/Field";
import { loginWithCode, sendLoginCode } from "@/lib/api/auth";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const CODE_LENGTH = 4;
const buttonClass =
  "h-12 w-full rounded-xl bg-primary text-[15px] font-bold text-white transition hover:bg-primary-hover disabled:opacity-60";

/** Only same-site paths, so `?next=` can't send the user off-site. */
function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

/** Phone number → 4-digit code → signed in. An unknown number is registered by the backend. */
function LoginInner() {
  const { t } = useI18n();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const { user, ready, signIn } = useAuth();

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Seconds until the backend accepts another code request.
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (ready && user) router.replace(next);
  }, [ready, user, next, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Алдаа гарлаа"));
    } finally {
      setBusy(false);
    }
  };

  const requestCode = () =>
    run(async () => {
      if (!/^\d{8}$/.test(phone)) throw new Error(t("8 оронтой утасны дугаар оруулна уу"));
      const res = await sendLoginCode(phone);
      setCode("");
      setCooldown(res.resend_in ?? 60);
      setStep("code");
    });

  if (!ready || user) return <LoginSkeleton />;

  return (
    <Container className="max-w-md py-4 md:py-20">
      <h1 className="hidden font-display text-[36px] font-bold leading-none md:block md:text-[44px]">{t("Нэвтрэх")}</h1>

      {step === "phone" ? (
        <form
          className="space-y-4 md:mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            requestCode();
          }}
        >
          <p className="text-sm text-muted-foreground">{t("Утасны дугаараа оруулна уу. Бид 4 оронтой код илгээнэ.")}</p>
          <Field label={t("Утасны дугаар")}>
            <PhoneInput value={phone} onChange={setPhone} autoComplete="tel" placeholder={t("Утасны дугаар")} autoFocus required />
          </Field>
          <button disabled={busy || phone.length !== 8} className={buttonClass}>
            {t("Код авах")}
          </button>
          <p className="text-xs text-muted-foreground">{t("Бүртгэлгүй дугаар бол автоматаар бүртгэгдэнэ.")}</p>
        </form>
      ) : (
        <form
          className="space-y-4 md:mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            run(async () => {
              signIn(await loginWithCode(phone, code));
            });
          }}
        >
          <p className="text-sm text-muted-foreground">{t("{phone} дугаар руу илгээсэн 4 оронтой кодыг оруулна уу.", { phone })}</p>
          <Field label={t("Баталгаажуулах код")}>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH))}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="0000"
              autoFocus
              className={cn(inputClass, "text-center text-xl font-bold tracking-[0.5em]")}
            />
          </Field>
          <button disabled={busy || code.length !== CODE_LENGTH} className={buttonClass}>
            {t("Нэвтрэх")}
          </button>
          <div className="flex justify-between gap-4 text-sm font-semibold">
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setError(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              {t("← Дугаар солих")}
            </button>
            <button type="button" onClick={requestCode} disabled={busy || cooldown > 0} className="text-primary disabled:opacity-60">
              {cooldown > 0 ? t("Код дахин авах ({n})", { n: cooldown }) : t("Код дахин авах")}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 rounded-xl bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">{error}</p>}
    </Container>
  );
}

/** Grey phone-step form while the session is checked. */
function LoginSkeleton() {
  return (
    <Container className="max-w-md animate-pulse py-4 md:py-20">
      <div className="hidden h-11 w-40 rounded bg-card md:block" />
      <div className="space-y-4 md:mt-6">
        <div className="h-4 w-4/5 rounded bg-card" />
        <div>
          <div className="mb-1.5 h-3.5 w-28 rounded bg-card" />
          <div className="h-12 rounded-xl bg-card" />
        </div>
        <div className="h-12 rounded-xl bg-card" />
      </div>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginInner />
    </Suspense>
  );
}
