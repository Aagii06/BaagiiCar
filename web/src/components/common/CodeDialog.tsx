"use client";

import { Field, inputClass } from "@/components/common/Field";
import type { WebUser } from "@/lib/api/auth";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

/** Modal for a one-time code that was just sent (e-mail or SMS); `verify` saves the change once the code checks out. */
export default function CodeDialog({
  title,
  description,
  length,
  resendIn = 60,
  resend,
  verify: check,
  onClose,
  onVerified,
}: {
  title: string;
  description: string;
  length: number;
  /** Seconds before another code may be asked for (from the send that opened the dialog). */
  resendIn?: number;
  resend: () => Promise<unknown>;
  verify: (code: string) => Promise<WebUser>;
  onClose: () => void;
  onVerified: (user: WebUser) => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The code was just sent before the modal opened.
  const [cooldown, setCooldown] = useState(resendIn);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((n) => n - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  // Filling in the last digit checks the code; a wrong one is cleared for another try.
  const verify = (value: string) =>
    run(async () => {
      try {
        onVerified(await check(value));
      } catch (err) {
        setCode("");
        throw err;
      }
    });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      {/* A div, not a form: this can sit inside another form. */}
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="code-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full space-y-4 rounded-t-2xl bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="code-dialog-title" className="text-lg font-bold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("Хаах")} className="-m-2 grid size-10 place-items-center rounded-full hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <Field label={t("Баталгаажуулах код")}>
          <input
            value={code}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, length);
              setCode(next);
              if (next.length === length) verify(next);
            }}
            // Enter would submit a form behind the modal.
            onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
            // readOnly, not disabled, so the field keeps focus for a retry.
            readOnly={busy}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder={"0".repeat(length)}
            autoFocus
            className={cn(inputClass, "text-center text-xl font-bold tracking-[0.5em]")}
          />
        </Field>
        {error && <p className="rounded-xl bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">{error}</p>}
        <div className="flex items-center justify-between gap-4 text-sm font-semibold">
          <span className="text-muted-foreground">{busy && code.length === length ? t("Шалгаж байна…") : ""}</span>
          <button
            type="button"
            onClick={() =>
              run(async () => {
                await resend();
                setCode("");
                setCooldown(60);
              })
            }
            disabled={busy || cooldown > 0}
            className="text-primary disabled:opacity-60"
          >
            {cooldown > 0 ? t("Код дахин авах ({n})", { n: cooldown }) : t("Код дахин авах")}
          </button>
        </div>
      </section>
    </div>
  );
}
