"use client";

import { Field, inputClass, PasswordInput } from "@/components/common/Field";
import { ErrorState, ListSkeleton } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import AdminOnly from "@/components/layout/AdminOnly";
import { DetailHeader } from "@/components/layout/PageHeader";
import { getPaymentSettings, savePaymentSettings, type PaymentSettings } from "@/lib/api/payments";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { tr } from "@/lib/i18n/translations";
import { Loader2 } from "lucide-react";
import { useState } from "react";

/**
 * The admin's payment settings: the price a dealer pays to renew an ad before its free renewal,
 * and the two ways a dealer tops up their balance — a bank transfer (the admin confirms it)
 * and QPay (credited automatically). Saving with QPay on checks the credentials against QPay first.
 */
export default function PaymentSettingsPage() {
  const settings = useApi(getPaymentSettings);
  return (
    <AdminOnly>
      {settings.loading && !settings.data ? (
        <ListSkeleton />
      ) : settings.error ? (
        <ErrorState message={settings.error.message} onRetry={settings.reload} />
      ) : (
        <SettingsForm settings={settings.data!} />
      )}
    </AdminOnly>
  );
}

function SettingsForm({ settings }: { settings: PaymentSettings }) {
  const toast = useToast();
  const [price, setPrice] = useState(String(settings.renew_price));
  const [bank, setBank] = useState(settings.bank);
  const [qpay, setQpay] = useState({ ...settings.qpay, password: "" });
  const [hasPassword, setHasPassword] = useState(settings.qpay.has_password);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  // A typed QPay password counts as a change; an empty one keeps the stored one.
  const current = JSON.stringify({ price, bank, qpay: { ...qpay, has_password: undefined } });
  const [baseline, setBaseline] = useState(current);
  const dirty = current !== baseline;

  const required = (on: boolean, v: string) => (submitted && on && !v.trim() ? tr("Заавал бөглөнө") : undefined);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving || !dirty) return;
    setSubmitted(true);
    const blank = (on: boolean, values: string[]) => on && values.some((v) => !v.trim());
    if (blank(bank.enabled, [bank.bank_name, bank.account_name, bank.account_number])) return;
    if (blank(qpay.enabled, [qpay.username, qpay.invoice_code, hasPassword ? "x" : qpay.password])) return;

    setSaving(true);
    try {
      const { enabled, sandbox, username, password, invoice_code } = qpay;
      const saved = await savePaymentSettings({
        renew_price: Number(price) || 0,
        bank,
        qpay: { enabled, sandbox, username, password, invoice_code },
      });
      setHasPassword(saved.qpay.has_password);
      const nextQpay = { ...qpay, password: "" };
      setQpay(nextQpay);
      setBaseline(JSON.stringify({ price, bank, qpay: { ...nextQpay, has_password: undefined } }));
      toast(tr("Хадгаллаа"));
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <DetailHeader
        title={tr("Төлбөрийн тохиргоо")}
        back="/profile"
        aside={
          <button
            type="submit"
            disabled={saving || !dirty}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            {tr("Хадгалах")}
          </button>
        }
      />

      <section className="space-y-4 rounded-2xl bg-card p-4">
        <div>
          <p className="text-[15px] font-bold">{tr("Зар шинэчлэх үнэ")}</p>
          <p className="text-sm text-muted-foreground">
            {tr("Дилер зараа 7 хоног хүлээлгүй шинэчлэхэд дансаас нь хасагдах дүн. Админ үнэгүй шинэчилнэ.")}
          </p>
        </div>
        <Field label={tr("Үнэ (₮)")}>
          <input
            inputMode="numeric"
            className={cn(inputClass, "font-mono")}
            value={price}
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setPrice(e.target.value.replace(/\D/g, "").slice(0, 9))}
          />
        </Field>
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-4">
        <Toggle
          title={tr("Дансаар шилжүүлэх")}
          desc={tr("Дилер энэ данс руу шилжүүлээд хүсэлт илгээнэ. Та баталгаажуулахад дансанд нь орно.")}
          checked={bank.enabled}
          onChange={(enabled) => setBank((b) => ({ ...b, enabled }))}
        />
        {bank.enabled && (
          <div className="space-y-3">
            <Field label={tr("Банк")} error={required(bank.enabled, bank.bank_name)}>
              <input className={inputClass} value={bank.bank_name} placeholder={tr("Жишээ нь: Хаан банк")} onChange={(e) => setBank((b) => ({ ...b, bank_name: e.target.value }))} />
            </Field>
            <Field label={tr("Хүлээн авагчийн нэр")} error={required(bank.enabled, bank.account_name)}>
              <input className={inputClass} value={bank.account_name} onChange={(e) => setBank((b) => ({ ...b, account_name: e.target.value }))} />
            </Field>
            <Field label={tr("Дансны дугаар")} error={required(bank.enabled, bank.account_number)}>
              <input className={cn(inputClass, "font-mono")} value={bank.account_number} onChange={(e) => setBank((b) => ({ ...b, account_number: e.target.value }))} />
            </Field>
            <Field label="IBAN">
              <input className={cn(inputClass, "font-mono")} value={bank.iban} onChange={(e) => setBank((b) => ({ ...b, iban: e.target.value }))} />
            </Field>
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-2xl bg-card p-4">
        <Toggle
          title="QPay"
          desc={tr("Дилер QR кодоор эсвэл банкны аппаар төлөхөд дансанд нь автоматаар орно.")}
          checked={qpay.enabled}
          onChange={(enabled) => setQpay((q) => ({ ...q, enabled }))}
        />
        {qpay.enabled && (
          <div className="space-y-3">
            <Field label={tr("Нэвтрэх нэр (username)")} error={required(qpay.enabled, qpay.username)}>
              <input className={cn(inputClass, "font-mono")} autoComplete="off" value={qpay.username} onChange={(e) => setQpay((q) => ({ ...q, username: e.target.value }))} />
            </Field>
            <Field
              label={tr("Нууц үг (password)")}
              hint={hasPassword ? tr("Хоосон орхивол хадгалсан нууц үг хэвээр үлдэнэ") : undefined}
              error={hasPassword ? undefined : required(qpay.enabled, qpay.password)}
            >
              <PasswordInput autoComplete="new-password" value={qpay.password} placeholder={hasPassword ? "••••••••" : undefined} onChange={(e) => setQpay((q) => ({ ...q, password: e.target.value }))} />
            </Field>
            <Field label={tr("Нэхэмжлэхийн код (invoice code)")} error={required(qpay.enabled, qpay.invoice_code)}>
              <input className={cn(inputClass, "font-mono")} autoComplete="off" value={qpay.invoice_code} onChange={(e) => setQpay((q) => ({ ...q, invoice_code: e.target.value }))} />
            </Field>
            <Toggle
              title={tr("Туршилтын орчин (sandbox)")}
              desc={tr("Асаалттай бол merchant-sandbox.qpay.mn руу холбогдоно. Жинхэнэ төлбөр авахдаа унтраана.")}
              checked={qpay.sandbox}
              onChange={(sandbox) => setQpay((q) => ({ ...q, sandbox }))}
            />
          </div>
        )}
      </section>
    </form>
  );
}

function Toggle({ title, desc, checked, onChange }: { title: string; desc: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="min-w-0 grow">
        <span className="block text-[15px] font-bold">{title}</span>
        <span className="block text-sm text-muted-foreground">{desc}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors", checked ? "bg-primary" : "bg-slate-300")}
      >
        <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}
