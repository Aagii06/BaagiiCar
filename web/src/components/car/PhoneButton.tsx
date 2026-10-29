"use client";

import { revealPhone } from "@/lib/api/cars";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { Car } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Check, Copy, Eye, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

/** "99•• ••••": enough to tell it's a number without giving it away. */
const masked = (phone: string) => `${phone.replace(/\D/g, "").slice(0, 2)}•• ••••`;
/** 8-digit numbers read as "9911 2233". */
const spaced = (phone: string) => (/^\d{8}$/.test(phone) ? `${phone.slice(0, 4)} ${phone.slice(4)}` : phone);

/** Hidden phone number (`compact`: label only, for the phone action bar); tapping counts the reveal and shows the number in a modal. */
export default function PhoneButton({ car, phone, compact, className }: { car: Car; phone: string; compact?: boolean; className?: string }) {
  const { t } = useI18n();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  // Fetched once per visitor; reopening the modal doesn't count again, signing out / in as someone else does.
  const [reveal, setRevealed] = useState<{ token: string | null; phone: string; count: number } | null>(null);
  const revealed = reveal?.token === token ? reveal : null;
  const [busy, setBusy] = useState(false);

  const show = async () => {
    if (revealed) return setOpen(true);
    setBusy(true);
    try {
      const res = await revealPhone(car.id, token);
      setRevealed({ token, phone: res.phone || phone, count: res.phone_view_count });
    } catch {
      // Still show the number if counting failed.
      setRevealed({ token, phone, count: car.phone_view_count ?? 0 });
    } finally {
      setBusy(false);
      setOpen(true);
    }
  };

  return (
    <>
      {compact ? (
        <button type="button" onClick={show} disabled={busy} className={cn("flex items-center justify-center gap-2 font-bold disabled:opacity-60", className)}>
          <Phone className="size-4" />
          {t("Дугаар харах")}
        </button>
      ) : (
        <button
          type="button"
          onClick={show}
          disabled={busy}
          className={cn("group flex w-full items-center gap-3 rounded-xl border border-border bg-white p-2 pr-2.5 text-left transition-colors hover:border-primary disabled:opacity-60", className)}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
            <Phone className="size-[18px]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-medium text-muted-foreground">{t("Утасны дугаар")}</span>
            <span className="block truncate text-[17px] font-bold tracking-wider">{masked(phone)}</span>
          </span>
          <span className="shrink-0 rounded-lg bg-primary px-3.5 py-2 text-sm font-bold text-white transition-colors group-hover:bg-primary-hover">
            {busy ? "…" : t("Харах")}
          </span>
        </button>
      )}
      {open && revealed && <PhoneDialog phone={revealed.phone} count={revealed.count} seller={car.dealer_name || car.seller_name} onClose={() => setOpen(false)} />}
    </>
  );
}

function PhoneDialog({ phone, count, seller, onClose }: { phone: string; count: number; seller: string | null; onClose: () => void }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
    } catch {
      // Clipboard blocked; the number is on screen anyway.
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="phone-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full rounded-t-3xl bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-w-sm sm:rounded-3xl sm:p-6"
      >
        <button type="button" onClick={onClose} aria-label={t("Хаах")} className="absolute right-3 top-3 grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
          <X className="size-5" />
        </button>
        <div className="flex flex-col items-center pt-2 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <Phone className="size-6" />
          </span>
          <h2 id="phone-title" className="mt-3 text-sm font-semibold text-muted-foreground">
            {seller || t("Утасны дугаар")}
          </h2>
          <a href={`tel:${phone}`} className="mt-1 font-display text-[34px] font-bold leading-tight tracking-wider hover:text-primary">
            {spaced(phone)}
          </a>
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground" title={t("Дугаар харсан")}>
            <Eye className="size-3.5" aria-hidden />
            <span className="sr-only">{t("Дугаар харсан")}</span>
            {count}
          </span>
        </div>
        <div className="mt-6 flex gap-2">
          <button type="button" onClick={copy} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white font-bold hover:bg-muted">
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {t(copied ? "Хуулсан" : "Хуулах")}
          </button>
          <a href={`tel:${phone}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover">
            <Phone className="size-4" />
            {t("Залгах")}
          </a>
        </div>
      </section>
    </div>
  );
}
