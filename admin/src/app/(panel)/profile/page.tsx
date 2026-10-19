"use client";

import { Field, FormError, inputClass } from "@/components/common/Field";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import { changePassword } from "@/lib/api/admin";
import { WEB_URL } from "@/lib/api/config";
import { useAuth } from "@/lib/auth/AuthProvider";
import { roleLabel } from "@/lib/constants";
import { initials, userName } from "@/lib/utils";
import { ExternalLink, LogOut } from "lucide-react";
import { useState } from "react";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const [pw, setPw] = useState({ password: "", password_confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (pw.password !== pw.password_confirm) return setError("Нууц үгийн давталт таарахгүй байна");
    setBusy(true);
    setError(null);
    try {
      await changePassword(user.id, pw.password, pw.password_confirm);
      toast("Нууц үг солигдлоо");
      setPw({ password: "", password_confirm: "" });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Профайл" />
      <section className="flex items-center gap-3 rounded-2xl bg-dark p-4 text-white">
        <span className="grid size-12 place-items-center rounded-xl bg-primary font-bold">{initials(userName(user))}</span>
        <div className="min-w-0">
          <p className="truncate font-bold">{userName(user)}</p>
          <p className="text-sm text-white/70">
            {user?.phonenumber} · {roleLabel(user?.role)}
          </p>
        </div>
      </section>

      <form onSubmit={submit} className="mt-4 space-y-4 rounded-2xl bg-card p-4">
        <h2 className="font-bold">Нууц үг солих</h2>
        <Field label="Шинэ нууц үг">
          <input className={inputClass} type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} required />
        </Field>
        <Field label="Давтах">
          <input className={inputClass} type="password" autoComplete="new-password" value={pw.password_confirm} onChange={(e) => setPw({ ...pw, password_confirm: e.target.value })} required />
        </Field>
        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
          Солих
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {WEB_URL && (
          <a href={WEB_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-2xl bg-card px-4 py-3.5 font-semibold">
            Вэб сайт нээх
            <ExternalLink className="size-4" />
          </a>
        )}
        <button onClick={logout} className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3.5 font-semibold text-destructive">
          Гарах
          <LogOut className="size-4" />
        </button>
      </div>
    </>
  );
}
