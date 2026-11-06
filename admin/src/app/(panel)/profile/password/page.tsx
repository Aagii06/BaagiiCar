"use client";

import { Field, FormError, PasswordInput } from "@/components/common/Field";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import OtpSheet from "@/components/profile/OtpSheet";
import { sendPasswordChangeCode, verifyPasswordChange, type PasswordChange } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthProvider";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * Own password change: old + new + confirm, then a 6-digit code emailed to the user's address.
 * The password is saved only after the code is verified.
 */
export default function ChangePasswordPage() {
  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [pw, setPw] = useState<PasswordChange>({ old_password: "", password: "", password_confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Set while the code sheet is open: where the code went and the resend wait.
  const [otp, setOtp] = useState<{ email: string; resendIn: number } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (pw.password !== pw.password_confirm) return setError("Нууц үгийн давталт таарахгүй байна");
    if (pw.password === pw.old_password) return setError("Шинэ нууц үг хуучинтай ижил байна");
    if (!user.email) return setError("Профайл дээрээ имэйл хаяг нэмсний дараа нууц үгээ солино уу");
    setBusy(true);
    setError(null);
    try {
      const sent = await sendPasswordChangeCode(pw);
      setOtp({ email: (sent as { email?: string })?.email || user.email, resendIn: sent?.resend_in ?? 60 });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const set = (key: keyof PasswordChange) => (e: React.ChangeEvent<HTMLInputElement>) => setPw({ ...pw, [key]: e.target.value });

  return (
    <>
      <DetailHeader title="Нууц үг солих" back="/profile" />
      <form onSubmit={submit} className="space-y-4 rounded-2xl bg-card p-4">
        <Field label="Хуучин нууц үг">
          <PasswordInput autoComplete="current-password" value={pw.old_password} onChange={set("old_password")} required />
        </Field>
        <Field label="Шинэ нууц үг">
          <PasswordInput autoComplete="new-password" value={pw.password} onChange={set("password")} required />
        </Field>
        <Field label="Шинэ нууц үг давтах">
          <PasswordInput autoComplete="new-password" value={pw.password_confirm} onChange={set("password_confirm")} required />
        </Field>
        <p className="text-xs text-muted-foreground">
          Баталгаажуулах код {user?.email ? <span className="font-semibold text-foreground">{user.email}</span> : "таны имэйл"} руу илгээгдэнэ.
        </p>
        <FormError message={error} />
        <button disabled={busy} className="h-12 w-full rounded-xl bg-primary font-bold text-white disabled:opacity-60">
          {busy ? "Илгээж байна…" : "Код авах"}
        </button>
      </form>

      {otp && (
        <OtpSheet<void>
          icon={<KeyRound className="size-7" />}
          title="Нууц үг солих"
          target={otp.email}
          length={6}
          resendIn={otp.resendIn}
          resend={() => sendPasswordChangeCode(pw)}
          verify={(code) => verifyPasswordChange(pw, code)}
          onVerified={() => {
            toast("Нууц үг солигдлоо");
            router.replace("/profile");
          }}
          onClose={() => setOtp(null)}
        />
      )}
    </>
  );
}
