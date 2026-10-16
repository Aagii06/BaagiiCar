"use client";

import AuthCard from "@/components/common/AuthCard";
import { Field, FormError, inputClass } from "@/components/common/Field";
import { LoadingState } from "@/components/common/States";
import { useAuth } from "@/lib/auth/AuthProvider";
import { safeNext } from "@/lib/nextPath";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function RegisterForm() {
  const { register, status } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [form, setForm] = useState({ phonenumber: "", firstname: "", lastname: "", email: "", password: "", password_confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: k === "phonenumber" ? e.target.value.replace(/\D/g, "") : e.target.value }));

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password_confirm) return setError("Нууц үгийн давталт таарахгүй байна");
    setBusy(true);
    setError(null);
    try {
      await register(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Бүртгүүлэх үед алдаа гарлаа");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Бүртгүүлэх" subtitle="Зар нэмэх, машин хадгалахын тулд бүртгүүлнэ үү.">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Овог">
            <input className={inputClass} autoComplete="family-name" value={form.lastname} onChange={set("lastname")} />
          </Field>
          <Field label="Нэр">
            <input className={inputClass} autoComplete="given-name" value={form.firstname} onChange={set("firstname")} required />
          </Field>
        </div>
        <Field label="Утасны дугаар">
          <input className={inputClass} inputMode="numeric" autoComplete="tel" maxLength={8} value={form.phonenumber} onChange={set("phonenumber")} placeholder="99112233" required />
        </Field>
        <Field label="И-мэйл (заавал биш)">
          <input className={inputClass} type="email" autoComplete="email" value={form.email} onChange={set("email")} />
        </Field>
        <Field label="Нууц үг" hint="Хамгийн багадаа 6 тэмдэгт">
          <input className={inputClass} type="password" autoComplete="new-password" minLength={6} value={form.password} onChange={set("password")} required />
        </Field>
        <Field label="Нууц үг давтах">
          <input className={inputClass} type="password" autoComplete="new-password" value={form.password_confirm} onChange={set("password_confirm")} required />
        </Field>
        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
          {busy ? "Түр хүлээнэ үү…" : "Бүртгүүлэх"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Бүртгэлтэй юу?{" "}
        <Link href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-bold text-primary">
          Нэвтрэх
        </Link>
      </p>
    </AuthCard>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <RegisterForm />
    </Suspense>
  );
}
