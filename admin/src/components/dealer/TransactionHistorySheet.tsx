"use client";

import { EmptyState } from "@/components/common/States";
import TransactionRow from "@/components/payment/TransactionRow";
import type { Transaction } from "@/lib/api/payments";
import { tr } from "@/lib/i18n/translations";
import { X } from "lucide-react";
import { useEffect } from "react";

/** A dealer's settled transactions in a modal, opened from the balance card. */
export default function TransactionHistorySheet({ dealerName, rows, onClose }: { dealerName: string; rows: Transaction[]; onClose: () => void }) {
  // Esc closes (unless a confirm is on top); the page behind doesn't scroll while it's up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector('[role="alertdialog"]') && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    // z-40: over the panel's bars (z-30), under confirms (z-50).
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-history-title"
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[85dvh] max-w-md animate-sheet-up flex-col rounded-t-3xl bg-background shadow-2xl"
      >
        <header className="flex items-center gap-2 px-5 pb-3 pt-4">
          <div className="min-w-0 flex-1">
            <h2 id="tx-history-title" className="text-lg font-bold">
              {tr("Гүйлгээний түүх")}
            </h2>
            <p className="truncate text-xs font-semibold text-muted-foreground">{dealerName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={tr("Хаах")} className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-muted">
            <X className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {!rows.length ? (
            <EmptyState title={tr("Гүйлгээ алга")} />
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
              {rows.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
