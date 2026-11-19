"use client";

import { usePrompt, useConfirm } from "@/components/common/Confirm";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import QpayPanel from "@/components/payment/QpayPanel";
import TransactionRow from "@/components/payment/TransactionRow";
import { adjustBalance, approveTopup, getDealerBalances, getPaymentInfo, listTransactions, rejectTopup, type Transaction } from "@/lib/api/payments";
import { tr } from "@/lib/i18n/translations";
import { useApi } from "@/lib/useApi";
import { formatMoney } from "@/lib/utils";
import { Check, Pencil, QrCode, Wallet } from "lucide-react";
import { useState } from "react";

/** Admin: a dealer's balance, manual adjustment, bank top-ups to confirm and transaction history. */
export default function DealerWalletSection({ dealerId, dealerName }: { dealerId: number; dealerName: string }) {
  const toast = useToast();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const [version, setVersion] = useState(0);
  const balances = useApi(getDealerBalances, String(version));
  const txs = useApi(() => listTransactions({ dealer_id: dealerId, limit: 100 }), `${dealerId}:${version}`);
  const info = useApi(getPaymentInfo);
  const balance = balances.data?.find((d) => d.id === dealerId)?.balance ?? 0;
  // An open QPay invoice for this dealer: its amount.
  const [qpayAmount, setQpayAmount] = useState<number | null>(null);
  const refresh = () => setVersion((v) => v + 1);

  const run = async (action: () => Promise<void>, done: string) => {
    try {
      await action();
      toast(done);
      refresh();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const approve = async (tx: Transaction) => {
    const ok = await confirm({
      title: tr("Шилжүүлэг орсныг баталгаажуулах уу?"),
      message: tr("{dealer} дилерийн дансанд {amount} нэмэгдэнэ. Банкны хуулгаасаа шалгасан эсэхээ нягтална уу.", { dealer: dealerName, amount: formatMoney(tx.amount) }),
      confirmLabel: tr("Батлах"),
      tone: "success",
      icon: Check,
    });
    if (ok) await run(() => approveTopup(tx.id), tr("Баталгаажууллаа, дилерийн дансанд орлоо"));
  };

  const reject = async (tx: Transaction) => {
    const reason = await prompt({ title: tr("Хүсэлтийг буцаах уу?"), label: tr("Шалтгаан"), placeholder: tr("Жишээ нь: шилжүүлэг ороогүй"), confirmLabel: tr("Буцаах"), tone: "danger" });
    if (reason) await run(() => rejectTopup(tx.id, reason), tr("Буцаалаа"));
  };

  const adjust = async () => {
    const raw = await prompt({
      title: tr("{dealer} — данс засах", { dealer: dealerName }),
      message: tr("Нэмэх бол эерэг (50000), хасах бол сөрөг (-50000) дүн бичнэ үү. Одоогийн үлдэгдэл {balance}.", { balance: formatMoney(balance) }),
      label: tr("Дүн (₮)"),
      placeholder: "50,000",
      confirmLabel: tr("Үргэлжлүүлэх"),
      money: "signed",
    });
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount === 0) return toast(tr("Дүн буруу байна"), "error");
    const note = await prompt({ title: tr("Тайлбар"), label: tr("Яагаад засаж байгаа вэ?"), placeholder: tr("Жишээ нь: бэлнээр төлсөн"), confirmLabel: tr("Хадгалах") });
    if (note) await run(() => adjustBalance(dealerId, amount, note), tr("Хадгаллаа"));
  };

  const qpay = async () => {
    const raw = await prompt({
      title: tr("{dealer} — QPay нэхэмжлэх", { dealer: dealerName }),
      message: tr("Төлөгдмөгц дилерийн дансанд автоматаар орно."),
      label: tr("Дүн (₮)"),
      placeholder: "50,000",
      confirmLabel: tr("Нэхэмжлэх үүсгэх"),
      icon: QrCode,
      money: true,
    });
    if (!raw) return;
    const amount = Number(raw);
    if (!Number.isInteger(amount) || amount < 100) return toast(tr("Дүн буруу байна"), "error");
    setQpayAmount(amount);
  };

  const onPaid = () => {
    setQpayAmount(null);
    toast(tr("Төлбөр орлоо, дилерийн дансанд нэмэгдлээ"));
    refresh();
  };

  if ((balances.loading && !balances.data) || (txs.loading && !txs.data)) return <ListSkeleton />;
  const error = balances.error ?? txs.error;
  if (error) return <ErrorState message={error.message} onRetry={refresh} />;
  const rows = txs.data?.rows ?? [];
  const pending = rows.filter((t) => t.status === "pending");
  const history = rows.filter((t) => t.status !== "pending");

  return (
    <div className="mt-4">
      <section className="flex items-center gap-3 rounded-2xl bg-linear-to-br from-primary to-orange-500 p-5 text-white shadow-md shadow-primary/30">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
            <Wallet className="size-4" />
            {tr("Дансны үлдэгдэл")}
          </p>
          <p className="mt-1 font-display text-3xl font-bold">{formatMoney(balance)}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <button type="button" onClick={adjust} className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-bold text-primary">
            <Pencil className="size-4" />
            {tr("Засах")}
          </button>
          {info.data?.qpay && (
            <button type="button" onClick={qpay} className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-sm font-bold text-white hover:bg-white/30">
              <QrCode className="size-4" />
              QPay
            </button>
          )}
        </div>
      </section>

      {qpayAmount && (
        <div className="mt-4">
          <QpayPanel key={qpayAmount} amount={qpayAmount} dealerId={dealerId} onPaid={onPaid} onClose={() => setQpayAmount(null)} />
        </div>
      )}

      {pending.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 font-bold">{tr("{n} хүсэлт хүлээгдэж буй", { n: pending.length })}</h2>
          <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
            {pending.map((tx) => (
              <TransactionRow key={tx.id} tx={tx} onApprove={() => approve(tx)} onReject={() => reject(tx)} />
            ))}
          </div>
        </>
      )}

      <h2 className="mb-2 mt-6 font-bold">{tr("Гүйлгээний түүх")}</h2>
      {!history.length ? (
        <EmptyState title={tr("Гүйлгээ алга")} />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
          {history.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}
