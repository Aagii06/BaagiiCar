"use client";

import { LEASING, monthlyPayment } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn, formatPrice, toNumber } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

// Highest monthly rate (%) the field accepts.
const MAX_RATE = 10;

/** Dark "Зээлийн тооцоолуур" card: 30% down, pick a term, adjust the monthly rate (default LEASING.monthlyRate), see the monthly. */
export default function LeasingCalculator({ price, carId, className }: { price: number | string | null; carId?: number; className?: string }) {
  const { t } = useI18n();
  const [months, setMonths] = useState(36);
  // Monthly rate in percent, as typed; kept as text so "1." or "" can be edited through.
  const defaultRate = (LEASING.monthlyRate * 100).toFixed(1);
  const [rateText, setRateText] = useState(defaultRate);
  const rate = Number(rateText.replace(",", "."));
  const rateValid = rateText.trim() !== "" && Number.isFinite(rate) && rate >= 0 && rate <= MAX_RATE;
  const amount = toNumber(price);
  const down = amount * LEASING.downPaymentRate;
  const monthly = rateValid ? monthlyPayment(amount, months, LEASING.downPaymentRate, rate / 100) : 0;
  const href = `/help?topic=leasing${carId ? `&car=${carId}` : ""}#contact`;

  return (
    <section className={cn("rounded-2xl bg-dark p-5 text-white md:p-6", className)}>
      <h2 className="font-bold">{t("Зээлийн тооцоолуур")}</h2>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-white/80">{t("Урьдчилгаа {n}%", { n: Math.round(LEASING.downPaymentRate * 100) })}</span>
        <span className="font-semibold">{amount ? formatPrice(down, t) : "—"}</span>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {LEASING.terms.map((m) => (
          <button
            key={m}
            onClick={() => setMonths(m)}
            aria-pressed={m === months}
            className={cn("rounded-lg py-2.5 text-sm font-bold transition-colors", m === months ? "bg-white text-dark" : "bg-dark-2 hover:bg-white/15")}
          >
            {t("{n} сар", { n: m })}
          </button>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <label htmlFor="leasing-rate" className="text-white/80">
          {t("Сарын хүү")}
        </label>
        <span className="flex items-center gap-2">
          {rateText !== defaultRate && (
            <button type="button" onClick={() => setRateText(defaultRate)} className="text-xs font-semibold text-white/60 hover:text-white">
              {t("Анхны хүү")}
            </button>
          )}
          <span className={cn("flex h-10 w-24 items-center rounded-lg bg-dark-2 pr-3 focus-within:ring-2", rateValid ? "focus-within:ring-white/30" : "ring-2 ring-destructive")}>
            <input
              id="leasing-rate"
              value={rateText}
              onChange={(e) => setRateText(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))}
              inputMode="decimal"
              aria-invalid={!rateValid}
              className="min-w-0 flex-1 bg-transparent px-3 text-right font-bold outline-none"
            />
            <span className="font-bold text-white/60">%</span>
          </span>
        </span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm text-white/80">{t("Сарын төлбөр ({n} сар)", { n: months })}</span>
        <span className="text-xl font-bold text-primary">{amount && rateValid ? formatPrice(monthly, t) : "—"}</span>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-white/50">
        {t("Жишиг тооцоо: сарын {rate}% хүүтэй. Бодит нөхцөл банк, лизингийн компаниас хамаарна.", { rate: rateValid ? String(rate) : defaultRate })}
      </p>
      <Link href={href} className="mt-4 block rounded-xl bg-white py-3 text-center text-sm font-bold text-dark hover:bg-white/90">
        {t("Зээлийн хүсэлт илгээх")}
      </Link>
    </section>
  );
}
