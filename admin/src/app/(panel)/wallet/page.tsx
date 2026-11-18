"use client";

import ChipTabs from "@/components/common/ChipTabs";
import { useConfirm, usePrompt } from "@/components/common/Confirm";
import { Field, inputClass } from "@/components/common/Field";
import Img from "@/components/common/Img";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import QpayPanel from "@/components/payment/QpayPanel";
import TransactionRow from "@/components/payment/TransactionRow";
import { catalogImage } from "@/lib/api/config";
import {
  adjustBalance,
  approveTopup,
  getDealerBalances,
  getPaymentInfo,
  listTransactions,
  rejectTopup,
  requestBankTopup,
  type DealerBalance,
  type Transaction,
  type TxStatus,
} from "@/lib/api/payments";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { useBackTo } from "@/lib/useBackTo";
import { cn, formatMoney } from "@/lib/utils";
import { tr } from "@/lib/i18n/translations";
import { Check, Copy, Landmark, Loader2, QrCode, Settings, Store, Wallet } from "lucide-react";
import Link from "next/link";
import { Suspense, useCallback, useState } from "react";

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

/** Admins: dealers' balances and bank top-ups to confirm. Dealers: their own balance, top-up, history. */
export default function WalletPage() {
  const isAdmin = useAuth().user?.role === ROLES.admin;
  return <Suspense fallback={<ListSkeleton />}>{isAdmin ? <AdminWallet /> : <DealerWallet />}</Suspense>;
}

// --- dealer ----------------------------------------------------------------

function DealerWallet() {
  const { back } = useBackTo("/profile");
  const toast = useToast();
  const info = useApi(getPaymentInfo);
  const history = useApi(() => listTransactions({ limit: 50 }), String(info.data?.balance ?? ""));
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"qpay" | "bank" | null>(null);
  const [qpayAmount, setQpayAmount] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const value = Number(amount) || 0;
  const valid = value >= 100;

  const onPaid = useCallback(() => {
    toast(tr("Төлбөр орлоо, дансанд нэмэгдлээ"));
    setQpayAmount(null);
    setMethod(null);
    setAmount("");
    info.reload();
  }, [toast, info]);

  const sendBank = async () => {
    if (!valid) return;
    setSending(true);
    try {
      await requestBankTopup(value, note);
      toast(tr("Хүсэлт илгээлээ. Админ шалгаад дансанд тань орно"));
      setMethod(null);
      setAmount("");
      setNote("");
      history.reload();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setSending(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text).then(() => toast(tr("Хуулагдлаа")), () => undefined);
  };

  if (info.loading && !info.data) return <ListSkeleton />;
  if (info.error) return <ErrorState message={info.error.message} onRetry={info.reload} />;
  const data = info.data!;
  if (!data.dealer_id) return <EmptyState title={tr("Та дилерт харьяалагдаагүй байна")} description={tr("Админд хандана уу")} />;
  const noMethod = !data.qpay && !data.bank;

  return (
    <>
      <PageHeader title={tr("Миний данс")} back={back} />

      <section className="rounded-2xl bg-linear-to-br from-primary to-orange-500 p-5 text-white shadow-md shadow-primary/30">
        <p className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Wallet className="size-4" />
          {tr("Дансны үлдэгдэл")}
        </p>
        <p className="mt-1 font-display text-3xl font-bold">{formatMoney(data.balance)}</p>
        <p className="mt-2 text-xs text-white/85">
          {tr("Зарыг {n} хоногт нэг удаа үнэгүй шинэчилнэ. Түүнээс өмнө шинэчлэхэд {price} дансаас хасагдана.", {
            n: data.renew_days,
            price: formatMoney(data.renew_price),
          })}
        </p>
      </section>

      <section className="mt-4 space-y-4 rounded-2xl bg-card p-4">
        <h2 className="font-bold">{tr("Данс цэнэглэх")}</h2>
        {noMethod ? (
          <p className="text-sm text-muted-foreground">{tr("Төлбөр хүлээн авах арга тохируулаагүй байна. Админд хандана уу")}</p>
        ) : (
          <>
            <Field label={tr("Дүн (₮)")}>
              <input
                inputMode="numeric"
                className={inputClass}
                value={amount ? Number(amount).toLocaleString("en-US") : ""}
                placeholder="0"
                onChange={(e) => {
                  setAmount(e.target.value.replace(/\D/g, "").slice(0, 9));
                  setQpayAmount(null);
                }}
              />
            </Field>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => {
                    setAmount(String(a));
                    setQpayAmount(null);
                  }}
                  className={cn("rounded-full px-3 py-1.5 text-xs font-bold", value === a ? "bg-primary text-white" : "bg-muted")}
                >
                  {formatMoney(a)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {data.qpay && (
                <button
                  type="button"
                  disabled={!valid}
                  onClick={() => {
                    setMethod("qpay");
                    setQpayAmount(value);
                  }}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-xl font-bold disabled:opacity-50",
                    method === "qpay" ? "bg-primary text-white" : "bg-primary-soft text-primary",
                  )}
                >
                  <QrCode className="size-5" />
                  QPay
                </button>
              )}
              {data.bank && (
                <button
                  type="button"
                  disabled={!valid}
                  onClick={() => {
                    setMethod("bank");
                    setQpayAmount(null);
                  }}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-xl font-bold disabled:opacity-50",
                    method === "bank" ? "bg-primary text-white" : "bg-primary-soft text-primary",
                  )}
                >
                  <Landmark className="size-5" />
                  {tr("Дансаар")}
                </button>
              )}
            </div>
            {!valid && amount !== "" && <p className="text-xs text-destructive">{tr("Хамгийн багадаа 100₮")}</p>}
          </>
        )}
      </section>

      {method === "qpay" && qpayAmount && (
        <div className="mt-4">
          <QpayPanel key={qpayAmount} amount={qpayAmount} onPaid={onPaid} onClose={() => setMethod(null)} />
        </div>
      )}

      {method === "bank" && data.bank && (
        <section className="mt-4 space-y-3 rounded-2xl bg-card p-4">
          <h2 className="font-bold">{tr("Дансаар шилжүүлэх")}</h2>
          <p className="text-sm text-muted-foreground">
            {tr("Доорх данс руу {amount} шилжүүлээд «Шилжүүлсэн» товчийг дарна уу. Админ шалгаад дансанд тань оруулна.", { amount: formatMoney(value) })}
          </p>
          <dl className="divide-y divide-border rounded-xl bg-muted/60">
            {[
              [tr("Банк"), data.bank.bank_name],
              [tr("Хүлээн авагч"), data.bank.account_name],
              [tr("Дансны дугаар"), data.bank.account_number],
              ...(data.bank.iban ? [["IBAN", data.bank.iban]] : []),
              [tr("Дүн"), String(value)],
            ].map(([label, v]) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2.5">
                <dt className="w-28 shrink-0 text-xs text-muted-foreground">{label}</dt>
                <dd className="min-w-0 flex-1 truncate font-semibold">{label === tr("Дүн") ? formatMoney(v) : v}</dd>
                <button type="button" onClick={() => copy(v)} aria-label={tr("Хуулах")} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-white">
                  <Copy className="size-4" />
                </button>
              </div>
            ))}
          </dl>
          <Field label={tr("Гүйлгээний утга / тайлбар")} hint={tr("Шилжүүлэхдээ бичсэн утгаа оруулбал админ хурдан олно")}>
            <input className={inputClass} value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <button
            type="button"
            onClick={sendBank}
            disabled={sending || !valid}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" strokeWidth={3} />}
            {tr("Шилжүүлсэн")}
          </button>
        </section>
      )}

      <h2 className="mb-2 mt-6 font-bold">{tr("Гүйлгээний түүх")}</h2>
      {history.loading && !history.data ? (
        <ListSkeleton />
      ) : history.error ? (
        <ErrorState message={history.error.message} onRetry={history.reload} />
      ) : !history.data?.rows.length ? (
        <EmptyState title={tr("Гүйлгээ алга")} />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
          {history.data.rows.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </>
  );
}

// --- admin -----------------------------------------------------------------

type AdminTab = "pending" | "dealers" | "all";

function AdminWallet() {
  const { back } = useBackTo("/profile");
  const toast = useToast();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const [tab, setTab] = useState<AdminTab>("pending");
  const [dealer, setDealer] = useState<DealerBalance | null>(null);
  const [version, setVersion] = useState(0);
  const status: TxStatus | undefined = tab === "pending" ? "pending" : undefined;

  const balances = useApi(getDealerBalances, String(version));
  const txs = useApi(
    () => listTransactions({ status, dealer_id: dealer?.id, limit: 100 }),
    `${tab}:${dealer?.id ?? ""}:${version}`,
  );
  const pendingCount = balances.data?.reduce((sum, d) => sum + d.pending, 0);
  const refresh = () => setVersion((v) => v + 1);

  const approve = async (tx: Transaction) => {
    const ok = await confirm({
      title: tr("Шилжүүлэг орсныг баталгаажуулах уу?"),
      message: tr("{dealer} дилерийн дансанд {amount} нэмэгдэнэ. Банкны хуулгаасаа шалгасан эсэхээ нягтална уу.", {
        dealer: tx.dealer_name ?? "",
        amount: formatMoney(tx.amount),
      }),
      confirmLabel: tr("Батлах"),
      tone: "success",
      icon: Check,
    });
    if (!ok) return;
    try {
      await approveTopup(tx.id);
      toast(tr("Баталгаажууллаа, дилерийн дансанд орлоо"));
      refresh();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const reject = async (tx: Transaction) => {
    const reason = await prompt({ title: tr("Хүсэлтийг буцаах уу?"), label: tr("Шалтгаан"), placeholder: tr("Жишээ нь: шилжүүлэг ороогүй"), confirmLabel: tr("Буцаах"), tone: "danger" });
    if (!reason) return;
    try {
      await rejectTopup(tx.id, reason);
      toast(tr("Буцаалаа"));
      refresh();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const adjust = async (d: DealerBalance) => {
    const raw = await prompt({
      title: tr("{dealer} — данс засах", { dealer: d.name }),
      message: tr("Нэмэх бол эерэг (50000), хасах бол сөрөг (-50000) дүн бичнэ үү. Одоогийн үлдэгдэл {balance}.", { balance: formatMoney(d.balance) }),
      label: tr("Дүн (₮)"),
      placeholder: "50000",
      confirmLabel: tr("Үргэлжлүүлэх"),
    });
    if (!raw) return;
    const amount = Number(raw.replace(/[\s,₮]/g, ""));
    if (!Number.isInteger(amount) || amount === 0) return toast(tr("Дүн буруу байна"), "error");
    const note = await prompt({ title: tr("Тайлбар"), label: tr("Яагаад засаж байгаа вэ?"), placeholder: tr("Жишээ нь: бэлнээр төлсөн"), confirmLabel: tr("Хадгалах") });
    if (!note) return;
    try {
      await adjustBalance(d.id, amount, note);
      toast(tr("Хадгаллаа"));
      refresh();
    } catch (err) {
      toast(errorMessage(err), "error");
    }
  };

  const tabs = [
    { value: "pending" as const, label: tr("Хүсэлт"), count: pendingCount },
    { value: "dealers" as const, label: tr("Дилерүүд") },
    { value: "all" as const, label: tr("Бүх гүйлгээ") },
  ];

  return (
    <>
      <PageHeader
        title={tr("Дилерийн данс")}
        back={back}
        aside={
          <Link href="/payment-settings" aria-label={tr("Төлбөрийн тохиргоо")} title={tr("Төлбөрийн тохиргоо")} className="grid size-10 place-items-center rounded-xl bg-muted hover:bg-muted/70">
            <Settings className="size-5" />
          </Link>
        }
      >
        <ChipTabs
          items={tabs}
          value={tab}
          onChange={(v) => {
            setTab(v);
            setDealer(null);
          }}
        />
        {dealer && tab === "all" && (
          <button type="button" onClick={() => setDealer(null)} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
            {dealer.name} ✕
          </button>
        )}
      </PageHeader>

      {tab === "dealers" ? (
        balances.loading && !balances.data ? (
          <ListSkeleton />
        ) : balances.error ? (
          <ErrorState message={balances.error.message} onRetry={balances.reload} />
        ) : !balances.data?.length ? (
          <EmptyState title={tr("Дилер алга")} />
        ) : (
          <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
            {balances.data.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3">
                <Img src={catalogImage(d.logo, "dealers")} className="size-10 shrink-0 rounded-xl bg-muted object-contain" fallback={<Store className="size-5 text-muted-foreground" />} />
                <button
                  type="button"
                  onClick={() => {
                    setDealer(d);
                    setTab("all");
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-bold">{d.name}</p>
                  <p className={cn("text-sm font-semibold", d.balance > 0 ? "text-success" : "text-muted-foreground")}>{formatMoney(d.balance)}</p>
                  {d.pending > 0 && <p className="text-xs font-semibold text-amber-ink">{tr("{n} хүсэлт хүлээгдэж буй", { n: d.pending })}</p>}
                </button>
                <button type="button" onClick={() => adjust(d)} className="shrink-0 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold">
                  {tr("Засах")}
                </button>
              </div>
            ))}
          </div>
        )
      ) : txs.loading && !txs.data ? (
        <ListSkeleton />
      ) : txs.error ? (
        <ErrorState message={txs.error.message} onRetry={txs.reload} />
      ) : !txs.data?.rows.length ? (
        <EmptyState title={tab === "pending" ? tr("Хүлээгдэж буй хүсэлт алга") : tr("Гүйлгээ алга")} />
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-2xl bg-card">
          {txs.data.rows.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} showDealer onApprove={() => approve(tx)} onReject={() => reject(tx)} />
          ))}
        </div>
      )}
    </>
  );
}
