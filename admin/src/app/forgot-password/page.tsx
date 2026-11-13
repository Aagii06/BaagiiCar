"use client";

import { Field, FormError, inputClass, PasswordInput, PhoneInput } from "@/components/common/Field";
import BrandMark from "@/components/layout/BrandMark";
import SplashScreen from "@/components/layout/SplashScreen";
import { forgotReset, forgotSend, forgotVerify } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthProvider";
import { tr } from "@/lib/i18n/translations";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

// Seconds before another code can be asked for (backend otpHelper OTP_RESEND_SECONDS).
const RESEND_SECONDS = 60;

type Step = "phone" | "code" | "password";

/**
 * Forgotten password, three steps on one card: the registered phone number →
 * the SMS code sent to it → a new password, after which the user is signed
 * straight into the panel.
 */
function ForgotPasswordForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const initialPhone = (useSearchParams().get("phone") ?? "").replace(/\D/g, "").slice(0, 8);

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState(initialPhone);
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Already signed in (or just signed in at the last step): on to the panel.
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const attempt = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Алдаа"));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    if (phone.length !== 8) return setError(tr("Утасны дугаар 8 оронтой байна"));
    await attempt(async () => {
      await forgotSend(phone);
      setCode("");
      setCooldown(RESEND_SECONDS);
      setStep("code");
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (step === "phone") return sendCode();
    if (step === "code") {
      if (!code.trim()) return setError(tr("Код оруулна уу"));
      return attempt(async () => {
        setResetToken(await forgotVerify(phone, code.trim()));
        setStep("password");
      });
    }
    if (password.length < 6) return setError(tr("Нууц үг 6-аас дээш тэмдэгттэй байна"));
    if (password !== confirm) return setError(tr("Нууц үг таарахгүй байна"));
    await attempt(async () => {
      await forgotReset(resetToken, password, confirm);
      // Signs in with the new password; the effect above opens the panel.
      await login(phone, password);
    });
  };

  if (status !== "anonymous") return <SplashScreen />;

  const description =
    step === "phone"
      ? tr("Бүртгэлтэй утасны дугаараа оруулна уу. Тэр дугаарт баталгаажуулах код илгээнэ.")
      : step === "code"
        ? tr("{phone} дугаарт ирсэн кодыг оруулна уу.", { phone })
        : tr("Дугаар баталгаажлаа. Шинэ нууц үгээ оруулна уу.");
  const submitLabel = step === "phone" ? tr("Код авах") : step === "code" ? tr("Баталгаажуулах") : tr("Хадгалаад нэвтрэх");

  return (
    <div className="flex min-h-screen flex-col justify-center px-5">
      <div className="rounded-3xl bg-dark px-6 pb-8 pt-7 text-white">
        <BrandMark dark />
        <h1 className="mt-8 font-display text-[28px] font-bold leading-tight tracking-tight">{tr("Нууц үг сэргээх")}</h1>
        <p className="mt-2 text-sm text-white/70">{description}</p>
      </div>
      <form onSubmit={submit} noValidate className="-mt-4 space-y-4 rounded-3xl bg-white p-5 shadow-xl shadow-black/5">
        {step === "phone" && (
          <Field label={tr("Утасны дугаар")}>
            <PhoneInput autoComplete="tel" placeholder="00000000" value={phone} onChange={setPhone} autoFocus />
          </Field>
        )}

        {step === "code" && (
          <div>
            <Field label={tr("Баталгаажуулах код")}>
              <input
                className={cn(inputClass, "text-center font-mono tracking-[0.4em]")}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
            </Field>
            <div className="mt-2 flex justify-between text-sm">
              <button
                type="button"
                className="font-semibold text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("phone");
                  setCooldown(0);
                  setError(null);
                }}
              >
                {tr("Дугаар солих")}
              </button>
              <button
                type="button"
                className="font-semibold text-primary disabled:opacity-50"
                disabled={busy || cooldown > 0}
                onClick={sendCode}
              >
                {tr("Код дахин авах")}
                {cooldown > 0 && ` (${cooldown})`}
              </button>
            </div>
          </div>
        )}

        {step === "password" && (
          <>
            {/* Lets the browser's password manager pair the new password with this account. */}
            <input type="text" autoComplete="username" value={phone} readOnly hidden />
            <Field label={tr("Шинэ нууц үг")}>
              <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            </Field>
            <Field label={tr("Шинэ нууц үг давтах")}>
              <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
          </>
        )}

        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
          {busy ? tr("Түр хүлээнэ үү…") : submitLabel}
        </button>
      </form>
      <Link href="/login" className="mt-5 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" />
        {tr("Нэвтрэх хуудас руу буцах")}
      </Link>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
