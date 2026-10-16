"use client";

import AuthCard from "@/components/common/AuthCard";
import { Field, FormError, inputClass } from "@/components/common/Field";
import { LoadingState } from "@/components/common/States";
import { useAuth } from "@/lib/auth/AuthProvider";
import { safeNext } from "@/lib/nextPath";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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
    <AuthCard title="Нэвтрэх" subtitle="Утасны дугаар, нууц үгээрээ нэвтэрнэ үү.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Утасны дугаар">
          <input className={inputClass} inputMode="numeric" autoComplete="tel" maxLength={8} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="99112233" required />
        </Field>
        <Field label="Нууц үг">
          <input className={inputClass} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
          {busy ? "Түр хүлээнэ үү…" : "Нэвтрэх"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Бүртгэлгүй юу?{" "}
        <Link href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-primary">
          Бүртгүүлэх
        </Link>
      </p>
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
