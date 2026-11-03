"use client";

import { Field, inputClass, PhoneInput } from "@/components/common/Field";
import { sendFeedback } from "@/lib/api/feedbacks";
import { displayName, useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * Footer "Тусламж" link that opens a price-offer form (car + price + phone). For now it goes through the
 * "Бидэнд бичих" endpoint, so it lands in the admin panel under Профайл → Санал хүсэлт, starting with "Үнийн санал".
 */
export default function PriceOffer({ className }: { className?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {t("Үнийн санал")}
      </button>
      {open && <PriceOfferDialog onClose={() => setOpen(false)} />}
    </>
  );
}

function PriceOfferDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const [car, setCar] = useState("");
  const [price, setPrice] = useState("");
  const [phone, setPhone] = useState(user?.phonenumber ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const canSend = !busy && car.trim().length > 0 && Number(price) > 0 && phone.length === 8;

  const send = async () => {
    if (!canSend) return;
    setBusy(true);
    setError(null);
    try {
      await sendFeedback(
        {
          name: user ? displayName(user) : "",
          phonenumber: phone,
          email: "",
          // Always in Mongolian: the admin reads it.
          message: [`Үнийн санал: ${price} сая ₮`, `Машин: ${car.trim()}`, note.trim()].filter(Boolean).join("\n"),
        },
        token
      );
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Алдаа гарлаа"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 text-foreground sm:items-center sm:p-4" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="price-offer-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full space-y-4 rounded-t-2xl bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:max-w-md sm:rounded-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="price-offer-title" className="text-lg font-bold">
            {t("Үнийн санал")}
          </h2>
          <button type="button" onClick={onClose} aria-label={t("Хаах")} className="-m-2 grid size-10 place-items-center rounded-full hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>
        {sent ? (
          <>
            <p className="flex items-start gap-2 text-sm font-semibold">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              {t("Үнийн санал илгээгдлээ. Бид {phone} дугаарт холбогдоно.", { phone })}
            </p>
            <button type="button" onClick={onClose} className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-hover">
              {t("Хаах")}
            </button>
          </>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <p className="text-sm text-muted-foreground">{t("Сонирхсон машин, санал болгох үнээ үлдээгээрэй. Бид тантай холбогдоно.")}</p>
            <Field label={t("Машин")}>
              <input value={car} onChange={(e) => setCar(e.target.value)} maxLength={200} placeholder="Toyota Prius 2015" autoFocus className={inputClass} />
            </Field>
            <Field label={t("Үнэ (сая ₮)")}>
              <input
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                placeholder="35"
                className={inputClass}
              />
            </Field>
            <Field label={t("Утасны дугаар")}>
              <PhoneInput value={phone} onChange={setPhone} placeholder="00000000" autoComplete="tel" />
            </Field>
            <Field label={t("Нэмэлт тайлбар")}>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={3} className={`${inputClass} h-auto py-3`} />
            </Field>
            {error && <p className="rounded-xl bg-destructive-soft px-4 py-3 text-sm font-medium text-destructive">{error}</p>}
            <button disabled={!canSend} className="h-12 w-full rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60">
              {busy ? t("Илгээж байна…") : t("Илгээх")}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
