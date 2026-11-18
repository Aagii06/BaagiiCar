"use client";

import { checkTopupInvoice, createTopupInvoice, type QpayInvoice } from "@/lib/api/payments";
import { errorMessage } from "@/components/common/Toast";
import { formatMoney } from "@/lib/utils";
import { tr } from "@/lib/i18n/translations";
import { Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// How often the page asks the backend whether QPay got the money.
const POLL_MS = 4000;

/**
 * A QPay invoice that tops up the dealer's balance: a QR to scan with any bank app, or (on a phone)
 * a link straight into one. Polls until the backend sees the payment, then calls `onPaid`.
 */
export default function QpayPanel({ amount, onPaid, onClose }: { amount: number; onPaid: (balance: number) => void; onClose: () => void }) {
  const [invoice, setInvoice] = useState<QpayInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [notYet, setNotYet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createTopupInvoice(amount)
      .then((inv) => !cancelled && setInvoice(inv))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [amount]);

  const check = useCallback(async () => {
    if (!invoice) return false;
    const res = await checkTopupInvoice(invoice.id);
    if (res.paid) onPaid(res.balance);
    return res.paid;
  }, [invoice, onPaid]);

  useEffect(() => {
    if (!invoice) return;
    let done = false;
    const timer = setInterval(() => {
      if (done) return;
      check()
        .then((paid) => (done = paid))
        .catch(() => undefined);
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [invoice, check]);

  const checkNow = async () => {
    setChecking(true);
    setNotYet(false);
    try {
      if (!(await check())) setNotYet(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="space-y-4 rounded-2xl bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-bold">{tr("QPay-ээр төлөх")}</h2>
        <button type="button" onClick={onClose} aria-label={tr("Хаах")} className="grid size-9 place-items-center rounded-xl hover:bg-muted">
          <X className="size-5" />
        </button>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : !invoice ? (
        <div className="flex justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- QPay returns a base64 PNG */}
            <img src={`data:image/png;base64,${invoice.qr_image}`} alt="QPay QR" className="size-56 rounded-xl border border-border bg-white p-2" />
            <p className="text-xl font-bold text-primary">{formatMoney(invoice.amount)}</p>
            <p className="text-center text-sm text-muted-foreground">{tr("Банкны аппаараа QR кодыг уншуулж төлнө үү")}</p>
          </div>

          {invoice.urls.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">{tr("Банкны апп-аар төлөх")}</p>
              <div className="grid grid-cols-4 gap-2">
                {invoice.urls.map((app) => (
                  <a key={app.name} href={app.link} className="flex flex-col items-center gap-1 rounded-xl border border-border p-2 text-center hover:border-primary/40">
                    {/* eslint-disable-next-line @next/next/no-img-element -- bank logos come from QPay */}
                    <img src={app.logo} alt="" className="size-9 rounded-lg" />
                    <span className="line-clamp-2 text-[11px] leading-tight">{app.description || app.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              type="button"
              onClick={checkNow}
              disabled={checking}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-foreground font-bold hover:bg-muted disabled:opacity-60"
            >
              {checking && <Loader2 className="size-4 animate-spin" />}
              {tr("Төлбөр шалгах")}
            </button>
            {notYet && <p className="text-center text-xs text-muted-foreground">{tr("Төлбөр хараахан орж ирээгүй байна")}</p>}
          </div>
        </>
      )}
    </section>
  );
}
