"use client";

import AuthCard from "@/components/common/AuthCard";
import { Field, FormError, inputClass } from "@/components/common/Field";
import { LoadingState } from "@/components/common/States";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { safeNext } from "@/lib/nextPath";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const CODE_LENGTH = 4;

/** Four single-digit boxes; typing or pasting fills them left to right. */
function CodeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const { t } = useI18n();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => refs.current[0]?.focus(), []);

  const setFrom = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return;
    const next = (value.slice(0, index) + digits).slice(0, CODE_LENGTH);
    onChange(next);
    refs.current[Math.min(next.length, CODE_LENGTH - 1)]?.focus();
  };

  return (
    <div className="grid grid-cols-4 gap-3">
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          aria-label={t("Кодын {n}-р орон", { n: i + 1 })}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={CODE_LENGTH}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => setFrom(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              const cut = value[i] ? i : Math.max(i - 1, 0);
              onChange(value.slice(0, cut));
              refs.current[cut]?.focus();
            }
          }}
          onFocus={(e) => e.target.select()}
          className={cn(inputClass, "h-16 text-center font-display text-3xl font-bold")}
        />
      ))}
    </div>
  );
}

function LoginForm() {
  const { sendCode, verifyCode, status } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

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

  const submitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length !== 8) return setError(t("8 оронтой утасны дугаар оруулна уу"));
    run(async () => {
      await sendCode(phone);
      setCode("");
      setStep("code");
    });
  };

  const submitCode = (value: string) => {
    if (value.length !== CODE_LENGTH) return setError(t("4 оронтой код оруулна уу"));
    run(() => verifyCode(phone, value));
  };

  if (step === "code")
    return (
      <AuthCard title={t("Код оруулах")} subtitle={t("{phone} дугаарт илгээсэн 4 оронтой кодыг оруулна уу.", { phone })}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitCode(code);
          }}
          className="space-y-4"
        >
          <CodeInput
            value={code}
            disabled={busy}
            onChange={(v) => {
              setCode(v);
              setError(null);
              if (v.length === CODE_LENGTH) submitCode(v);
            }}
          />
          <FormError message={error} />
          <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
            {busy ? t("Шалгаж байна…") : t("Нэвтрэх")}
          </button>
        </form>
        <div className="mt-5 flex justify-between text-sm">
          <button
            onClick={() => {
              setStep("phone");
              setError(null);
            }}
            className="font-semibold text-muted-foreground hover:text-foreground"
          >
            {t("← Дугаар солих")}
          </button>
          <button onClick={() => run(() => sendCode(phone))} disabled={busy} className="font-bold text-primary disabled:opacity-60">
            {t("Код дахин авах")}
          </button>
        </div>
      </AuthCard>
    );

  return (
    <AuthCard title={t("Нэвтрэх")} subtitle={t("Утасны дугаараа оруулаад нэг удаагийн кодоор нэвтэрнэ. Бүртгэлгүй бол автоматаар бүртгэгдэнэ.")}>
      <form onSubmit={submitPhone} className="space-y-4">
        <Field label={t("Утасны дугаар")}>
          <input
            className={inputClass}
            inputMode="numeric"
            autoComplete="tel"
            autoFocus
            maxLength={8}
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value.replace(/\D/g, ""));
              setError(null);
            }}
            placeholder={t("Утасны дугаар")}
            required
          />
        </Field>
        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
          {busy ? t("Түр хүлээнэ үү…") : t("Код авах")}
        </button>
      </form>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginForm />
    </Suspense>
  );
}
