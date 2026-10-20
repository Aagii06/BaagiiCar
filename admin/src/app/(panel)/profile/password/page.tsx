"use client";

import { Field, FormError, inputClass } from "@/components/common/Field";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import { changePassword } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ChangePasswordPage() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [pw, setPw] = useState({ old_password: "", password: "", password_confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (pw.password !== pw.password_confirm) return setError("Нууц үгийн давталт таарахгүй байна");
    setBusy(true);
    setError(null);
    try {
      await changePassword(user.id, pw.password, pw.password_confirm, pw.old_password);
      toast("Нууц үг солигдлоо");
      router.replace("/profile");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DetailHeader title="Нууц үг солих" back="/profile" />
      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-4">
        <Field label="Хуучин нууц үг">
          <input className={inputClass} type="password" autoComplete="current-password" value={pw.old_password} onChange={(e) => setPw({ ...pw, old_password: e.target.value })} required />
        </Field>
        <Field label="Шинэ нууц үг">
          <input className={inputClass} type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} required />
        </Field>
        <Field label="Шинэ нууц үг давтах">
          <input className={inputClass} type="password" autoComplete="new-password" value={pw.password_confirm} onChange={(e) => setPw({ ...pw, password_confirm: e.target.value })} required />
        </Field>
        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
          Солих
        </button>
      </form>
    </>
  );
}
