"use client";

import Img from "@/components/common/Img";
import { checkTopupInvoice, createTopupInvoice, type QpayInvoice } from "@/lib/api/payments";
import { errorMessage } from "@/components/common/Toast";
import { formatMoney } from "@/lib/utils";
import { tr } from "@/lib/i18n/translations";
import { Check, Copy, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// How often the page asks the backend whether QPay got the money.
const POLL_MS = 4000;

/**
 * A QPay invoice that tops up the dealer's balance: a QR to scan with any bank app, or (on a phone)
 * a link straight into one. Polls until the backend sees the payment, then calls `onPaid`.
 * `dealerId`: an admin billing that dealer (the QR / link is then passed on to them).
 */
export default function QpayPanel({
  amount,
  dealerId,
  onPaid,
  onClose,
}: {
  amount: number;
  dealerId?: number;
  onPaid: (balance: number) => void;
  onClose: () => void;
}) {
  const [invoice, setInvoice] = useState<QpayInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [notYet, setNotYet] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    createTopupInvoice(amount, dealerId)
      .then((inv) => !cancelled && setInvoice(inv))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [amount, dealerId]);

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

  const copyLink = async () => {
    if (!invoice?.short_url) return;
    try {
      await navigator.clipboard.writeText(invoice.short_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (http / old browser): the link stays visible to copy by hand.
    }
  };

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

          {/* The admin sends this to the dealer (chat / SMS); it opens the same invoice. */}
          {invoice.short_url && (
            <div className="flex items-center gap-2 rounded-xl bg-muted/60 p-2 pl-3">
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{invoice.short_url}</span>
              <button type="button" onClick={copyLink} className="flex shrink-0 items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-bold hover:bg-border">
                {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                {copied ? tr("Хуулсан") : tr("Холбоос хуулах")}
              </button>
            </div>
          )}

          {invoice.urls.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold">{tr("Банкны апп-аар төлөх")}</p>
              <div className="grid grid-cols-4 gap-2">
                {invoice.urls.map((app) => (
                  <a key={app.name} href={app.link} className="flex flex-col items-center gap-1 rounded-xl border border-border p-2 text-center hover:border-primary/40">
                    <Img src={app.logo} className="size-9 rounded-lg" fallback={<span className="size-9 rounded-lg bg-muted" />} />
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
