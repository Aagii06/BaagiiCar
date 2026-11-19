"use client";

import type { Transaction } from "@/lib/api/payments";
import { cn, formatMoney } from "@/lib/utils";
import { tr } from "@/lib/i18n/translations";
import { Check, Undo2 } from "lucide-react";

const TYPE_LABEL: Record<Transaction["type"], string> = {
  topup: "Данс цэнэглэлт",
  renew: "Зар шинэчилсэн",
  // Shown as a top-up (or a deduction for old negative ones); the method line already says "Админ".
  adjust: "Данс цэнэглэлт",
};
const METHOD_LABEL: Record<Transaction["method"], string> = {
  qpay: "QPay",
  bank: "Дансаар",
  balance: "Үлдэгдлээс",
  admin: "Админ",
};
const STATUS: Record<Transaction["status"], { label: string; className: string }> = {
  pending: { label: "Хүлээгдэж буй", className: "bg-amber-soft text-amber-ink" },
  done: { label: "Амжилттай", className: "bg-success-soft text-success" },
  rejected: { label: "Буцаасан", className: "bg-destructive-soft text-destructive" },
};

/** One wallet transaction; `onApprove` / `onReject` (admin) show on pending bank top-ups. */
export default function TransactionRow({
  tx,
  showDealer,
  onApprove,
  onReject,
}: {
  tx: Transaction;
  showDealer?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const st = STATUS[tx.status];
  const income = tx.amount > 0;
  return (
    <article className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          {showDealer && <p className="truncate text-xs font-bold text-primary">{tx.dealer_name ?? `#${tx.dealer_id}`}</p>}
          <p className="truncate font-bold">
            {tr(tx.type === "adjust" && tx.amount < 0 ? "Данснаас хассан" : TYPE_LABEL[tx.type])}
            {tx.car_code && <span className="font-medium text-muted-foreground"> · #{tx.car_code}</span>}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {tr(METHOD_LABEL[tx.method])} · {tx.created_at?.slice(0, 16)}
            {tx.created_by_name && ` · ${tx.created_by_name}`}
          </p>
          {tx.note && <p className="mt-0.5 line-clamp-2 text-xs">{tx.note}</p>}
          {tx.status === "rejected" && tx.reject_reason && <p className="mt-0.5 line-clamp-2 text-xs text-destructive">↩ {tx.reject_reason}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className={cn("font-bold", tx.status !== "done" ? "text-muted-foreground" : income ? "text-success" : "text-foreground")}>
            {income ? "+" : "−"}
            {formatMoney(Math.abs(tx.amount))}
          </p>
          <span className={cn("mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold", st.className)}>{tr(st.label)}</span>
        </div>
      </div>
      {tx.status === "pending" && (onApprove || onReject) && (
        <div className="mt-2 flex gap-2">
          {onApprove && (
            <button type="button" onClick={onApprove} className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white">
              <Check className="size-3.5" strokeWidth={3} />
              {tr("Орсон, батлах")}
            </button>
          )}
          {onReject && (
            <button type="button" onClick={onReject} className="flex items-center gap-1 rounded-lg bg-destructive-soft px-3 py-1.5 text-xs font-bold text-destructive">
              <Undo2 className="size-3.5" />
              {tr("Буцаах")}
            </button>
          )}
        </div>
      )}
    </article>
  );
}
