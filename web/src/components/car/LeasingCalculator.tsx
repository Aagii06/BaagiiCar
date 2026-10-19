"use client";

import { LEASING, monthlyPayment } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn, formatPrice, toNumber } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

/** Dark "Зээлийн тооцоолуур" card: 30% down, pick a term, see the monthly. */
export default function LeasingCalculator({ price, carId, className }: { price: number | string | null; carId?: number; className?: string }) {
  const { t } = useI18n();
  const [months, setMonths] = useState(36);
  const amount = toNumber(price);
  const down = amount * LEASING.downPaymentRate;
  const monthly = monthlyPayment(amount, months);
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
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-sm text-white/80">{t("Сарын төлбөр ({n} сар)", { n: months })}</span>
        <span className="text-xl font-bold text-primary">{amount ? formatPrice(monthly, t) : "—"}</span>
      </div>
      <p className="mt-2 text-[11px] leading-4 text-white/50">
        {t("Жишиг тооцоо: сарын {rate}% хүүтэй. Бодит нөхцөл банк, лизингийн компаниас хамаарна.", { rate: (LEASING.monthlyRate * 100).toFixed(1) })}
      </p>
      <Link href={href} className="mt-4 block rounded-xl bg-white py-3 text-center text-sm font-bold text-dark hover:bg-white/90">
        {t("Зээлийн хүсэлт илгээх")}
      </Link>
    </section>
  );
}
