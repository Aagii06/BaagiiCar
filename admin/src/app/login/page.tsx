"use client";

import { Field, FormError, PasswordInput, PhoneInput } from "@/components/common/Field";
import BrandMark from "@/components/layout/BrandMark";
import SplashScreen from "@/components/layout/SplashScreen";
import { useAuth } from "@/lib/auth/AuthProvider";
import { APP_CUSTOMER_URL, useInApp } from "@/lib/inApp";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { tr } from "@/lib/i18n/translations";

function safeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

function LoginForm() {
  const { login, status } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Which fields get a red border: a bad number only the phone; wrong credentials both.
  const [invalid, setInvalid] = useState<"phone" | "both" | null>(null);
  const [shaking, setShaking] = useState(false);
  const [busy, setBusy] = useState(false);
  const inApp = useInApp();

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  const fail = (message: string, fields: "phone" | "both") => {
    setError(message);
    setInvalid(fields);
    setShaking(true);
  };

  const clearError = () => {
    setError(null);
    setInvalid(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[5-9]\d{7}$/.test(phone)) return fail(tr("Утасны дугаар 5–9-өөр эхэлсэн 8 оронтой тоо байна"), "phone");
    setBusy(true);
    clearError();
    try {
      await login(phone, password);
    } catch (err) {
      fail(err instanceof Error ? err.message : tr("Нэвтрэх үед алдаа гарлаа"), "both");
    } finally {
      setBusy(false);
    }
  };

  // The form appears only once the saved session turned out to be missing / invalid;
  // a signed-in user keeps the splash until the redirect above lands.
  if (status !== "anonymous") return <SplashScreen />;

  return (
    <div className="flex min-h-screen flex-col justify-center px-5">
      <div className="rounded-3xl bg-dark px-6 pb-8 pt-7 text-white">
        <BrandMark dark />
        <h1 className="mt-8 font-display text-[28px] font-bold leading-tight tracking-tight">
          {tr("Удирдлагын")} <span className="text-primary">{tr("самбар")}</span>
        </h1>
        <p className="mt-2 text-sm text-white/70">{tr("Админ эсвэл дилер эрхтэй утасны дугаараараа нэвтэрнэ үү.")}</p>
      </div>
      <form onSubmit={submit} className="-mt-4 space-y-4 rounded-3xl bg-white p-5 shadow-xl shadow-black/5">
        <div className={shaking ? "animate-shake space-y-4" : "space-y-4"} onAnimationEnd={() => setShaking(false)}>
          <Field label={tr("Утасны дугаар")}>
            <PhoneInput
              autoComplete="tel"
              placeholder="00000000"
              value={phone}
              onChange={(v) => (setPhone(v), clearError())}
              aria-invalid={invalid !== null}
              required
            />
          </Field>
          <Field label={tr("Нууц үг")}>
            <PasswordInput
              autoComplete="current-password"
              placeholder={tr("Нууц үг")}
              value={password}
              onChange={(e) => (setPassword(e.target.value), clearError())}
              aria-invalid={invalid === "both"}
              required
            />
          </Field>
        </div>
        <div className="-mt-1 text-right">
          <Link href={phone ? `/forgot-password?phone=${phone}` : "/forgot-password"} className="text-sm font-semibold text-primary">
            {tr("Нууц үгээ мартсан уу?")}
          </Link>
        </div>
        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
          {busy ? tr("Түр хүлээнэ үү…") : tr("Нэвтрэх")}
        </button>
      </form>
      {inApp && (
        <a href={APP_CUSTOMER_URL} className="mt-5 block text-center text-sm font-semibold text-primary">
          {tr("Хэрэглэгчээр үргэлжлүүлэх")}
        </a>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <LoginForm />
    </Suspense>
  );
}
