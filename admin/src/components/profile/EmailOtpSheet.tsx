"use client";

import { FormError } from "@/components/common/Field";
import { errorMessage } from "@/components/common/Toast";
import { sendEmailChangeCode, verifyEmailChange } from "@/lib/api/admin";
import type { User } from "@/lib/api/types";
import { MailCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const CODE_LENGTH = 6;

/**
 * Bottom sheet for confirming a new email: the code was already sent to `email` when it opens.
 * Calls `onVerified` with the updated user once the server has saved the address.
 */
export default function EmailOtpSheet({
  email,
  resendIn: initialResendIn,
  onVerified,
  onClose,
}: {
  email: string;
  /** Seconds until another code may be requested (from the send response). */
  resendIn: number;
  onVerified: (user: User) => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(initialResendIn);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const verify = async (value: string) => {
    if (value.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    try {
      onVerified(await verifyEmailChange(email, value));
    } catch (err) {
      setError(errorMessage(err));
      setCode("");
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  const resend = async () => {
    setError(null);
    try {
      const sent = await sendEmailChangeCode(email);
      setResendIn(sent?.resend_in ?? 60);
      setCode("");
      inputRef.current?.focus();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={onClose} />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-otp-title"
        onSubmit={(e) => {
          e.preventDefault();
          verify(code);
        }}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-md animate-sheet-up rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary">
            <MailCheck className="size-7" />
          </span>
          <h2 id="email-otp-title" className="mt-3 text-lg font-bold">
            Имэйл баталгаажуулах
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{email}</span> хаяг руу илгээсэн {CODE_LENGTH} оронтой кодыг оруулна уу
          </p>
        </div>

        <input
          ref={inputRef}
          value={code}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH);
            setCode(next);
            // Submit as soon as the last digit is typed (or a code is pasted).
            if (next.length === CODE_LENGTH) verify(next);
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          placeholder="000000"
          aria-label="Баталгаажуулах код"
          disabled={busy}
          className="mt-5 h-14 w-full rounded-xl border border-input bg-white text-center font-display text-2xl tracking-[0.5em] outline-none transition placeholder:text-muted-foreground/40 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-muted"
        />
        <div className="mt-3">
          <FormError message={error} />
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {resendIn > 0 ? (
            `Дахин код авах: ${resendIn} сек`
          ) : (
            <button type="button" onClick={resend} className="font-bold text-primary hover:underline">
              Код дахин илгээх
            </button>
          )}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className="h-12 rounded-xl bg-muted font-bold hover:bg-border">
            Болих
          </button>
          <button disabled={busy || code.length !== CODE_LENGTH} className="h-12 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
            {busy ? "Шалгаж байна…" : "Баталгаажуулах"}
          </button>
        </div>
      </form>
    </div>
  );
}
