"use client";

import { Field, FormError, inputClass } from "@/components/common/Field";
import { LoadingState } from "@/components/common/States";
import BrandMark from "@/components/layout/BrandMark";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(phone, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Нэвтрэх үед алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-5">
      <div className="rounded-3xl bg-dark px-6 pb-8 pt-7 text-white">
        <span className="[&_.font-display]:text-white">
          <BrandMark />
        </span>
        <h1 className="mt-8 font-display text-[28px] font-bold leading-tight tracking-tight">
          Удирдлагын <span className="text-amber">самбар</span>
        </h1>
        <p className="mt-2 text-sm text-white/70">Админ эрхтэй утасны дугаараараа нэвтэрнэ үү.</p>
      </div>
      <form onSubmit={submit} className="-mt-4 space-y-4 rounded-3xl bg-white p-5 shadow-xl shadow-black/5">
        <Field label="Утасны дугаар">
          <input className={inputClass} inputMode="numeric" autoComplete="tel" maxLength={8} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} required />
        </Field>
        <Field label="Нууц үг">
          <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
          {busy ? "Түр хүлээнэ үү…" : "Нэвтрэх"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
