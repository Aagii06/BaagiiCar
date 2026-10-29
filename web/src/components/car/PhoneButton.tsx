"use client";

import { revealPhone } from "@/lib/api/cars";
import type { Car } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Check, Copy, Eye, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";

/** "99** ****": enough to tell it's a number without giving it away. */
const masked = (phone: string) => `${phone.replace(/\D/g, "").slice(0, 2)}** ****`;

/** Hidden phone number (`compact`: label only, for the phone action bar); tapping counts the reveal and shows the number in a modal. */
export default function PhoneButton({ car, phone, compact, className }: { car: Car; phone: string; compact?: boolean; className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // Fetched once per page; reopening the modal doesn't count again.
  const [revealed, setRevealed] = useState<{ phone: string; count: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const show = async () => {
    if (revealed) return setOpen(true);
    setBusy(true);
    try {
      const res = await revealPhone(car.id);
      setRevealed({ phone: res.phone || phone, count: res.phone_view_count });
    } catch {
      // Still show the number if counting failed.
      setRevealed({ phone, count: car.phone_view_count ?? 0 });
    } finally {
      setBusy(false);
      setOpen(true);
    }
  };

  return (
    <>
      <button type="button" onClick={show} disabled={busy} className={cn("flex items-center justify-center gap-2 font-bold disabled:opacity-60", className)}>
        <Phone className="size-4" />
        {compact ? (
          t("Дугаар харах")
        ) : (
          <>
            <span>{masked(phone)}</span>
            <span className="text-xs font-semibold opacity-80">· {t("Дугаар харах")}</span>
          </>
        )}
      </button>
      {open && revealed && <PhoneDialog phone={revealed.phone} count={revealed.count} onClose={() => setOpen(false)} />}
    </>
  );
}

function PhoneDialog({ phone, count, onClose }: { phone: string; count: number; onClose: () => void }) {
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
        className="w-full space-y-5 rounded-t-2xl bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-w-sm sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="phone-title" className="text-lg font-bold">
            {t("Утасны дугаар")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("Хаах")} className="-m-2 grid size-10 place-items-center rounded-full hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        <div className="text-center">
          <p className="font-display text-[32px] font-bold tracking-wide">{phone}</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-medium text-muted-foreground" title={t("Дугаар харсан")}>
            <Eye className="size-4" aria-hidden />
            <span className="sr-only">{t("Дугаар харсан")}</span>
            {count}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={copy} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] border-foreground font-bold hover:bg-muted">
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
