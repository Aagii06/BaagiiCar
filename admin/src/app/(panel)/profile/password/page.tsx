"use client";

import { Field, PasswordInput } from "@/components/common/Field";
import { errorMessage, useToast } from "@/components/common/Toast";
import { DetailHeader } from "@/components/layout/PageHeader";
import OtpSheet from "@/components/profile/OtpSheet";
import { sendPasswordChangeCode, verifyPasswordChange } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthProvider";
import { KeyRound, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { tr } from "@/lib/i18n/translations";

const MIN_PASSWORD = 6;

/**
 * The signed-in user's password: current one first, then the new one twice.
 * "Хадгалах" has the backend check the current password and mail a code to the
 * user's email, then asks for that code in a sheet; the password only changes
 * once it is entered.
 */
export default function ChangePasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const hasEmail = Boolean(user?.email);

  const currentRef = useRef<HTMLInputElement>(null);
  const newRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sentTo, setSentTo] = useState("");
  // The passwords the last code was asked for; changing them needs a new code.
  const [sentFor, setSentFor] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const currentError = submitted && !current ? tr("Одоогийн нууц үгээ оруулна уу") : undefined;
  const newError = submitted && next.length < MIN_PASSWORD ? tr("Нууц үг 6-аас дээш тэмдэгттэй байна") : undefined;
  const confirmError = submitted && !newError && confirm !== next ? tr("Нууц үг таарахгүй байна") : undefined;

  const body = { old_password: current, password: next, password_confirm: confirm };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
    if (!current) return currentRef.current?.focus();
    if (next.length < MIN_PASSWORD) return newRef.current?.focus();
    if (confirm !== next) return confirmRef.current?.focus();
    if (sending) return;
    // Closed the sheet without confirming: reopen it while the code still stands.
    if (cooldown > 0 && sentFor === `${current}\n${next}`) return setSheetOpen(true);
    setSending(true);
    try {
      const sent = await sendPasswordChangeCode(body);
      setSentTo(sent.email || user?.email || "");
      setSentFor(`${current}\n${next}`);
      setCooldown(sent.resend_in ?? 60);
      toast(tr("Код илгээлээ"));
      setSheetOpen(true);
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <form onSubmit={onSubmit} noValidate>
        <DetailHeader
          title={tr("Нууц үг солих")}
          back="/profile"
          aside={
            <button
              type="submit"
              disabled={!hasEmail || sending}
              className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {sending && <Loader2 className="size-4 animate-spin" />}
              {tr("Хадгалах")}
            </button>
          }
        />

        {hasEmail ? (
          <p className="mb-4 text-sm text-muted-foreground">{tr("Солихын өмнө бүртгэлтэй имэйл рүү тань баталгаажуулах код илгээнэ.")}</p>
        ) : (
          <div className="mb-4 rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm">
            <p className="font-medium text-amber-700">{tr("Нууц үг солихын тулд эхлээд профайлдаа имэйл хаягаа нэмнэ үү.")}</p>
            <Link href="/profile/edit" className="mt-1 inline-block font-semibold text-primary hover:underline">
              {tr("Имэйл нэмэх")}
            </Link>
          </div>
        )}

        <fieldset disabled={!hasEmail} className="space-y-4 rounded-2xl bg-card p-4 disabled:opacity-60">
          <Field label={tr("Одоогийн нууц үг")} error={currentError}>
            <PasswordInput ref={currentRef} autoFocus={hasEmail} autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} aria-invalid={Boolean(currentError)} />
          </Field>
          <Field label={tr("Шинэ нууц үг")} error={newError} hint={tr("6-аас дээш тэмдэгт")}>
            <PasswordInput ref={newRef} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-invalid={Boolean(newError)} />
          </Field>
          <Field label={tr("Шинэ нууц үг давтах")} error={confirmError}>
            <PasswordInput ref={confirmRef} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-invalid={Boolean(confirmError)} />
          </Field>
        </fieldset>
      </form>

      {sheetOpen && (
        <OtpSheet<void>
          icon={<KeyRound className="size-7" />}
          title={tr("Баталгаажуулах код")}
          target={sentTo}
          length={6}
          resendIn={cooldown}
          onResent={setCooldown}
          resend={() => sendPasswordChangeCode(body)}
          verify={(code) => verifyPasswordChange(body, code)}
          onVerified={() => {
            toast(tr("Нууц үг солигдлоо"));
            router.replace("/profile");
          }}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </>
  );
}
