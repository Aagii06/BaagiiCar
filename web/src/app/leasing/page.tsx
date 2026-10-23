"use client";

import LeasingCalculator from "@/components/car/LeasingCalculator";
import Container, { PageTitle } from "@/components/common/Container";
import { Field, inputClass } from "@/components/common/Field";
import { LEASING } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import Link from "next/link";
import { useState } from "react";

export default function LeasingPage() {
  const { t } = useI18n();
  const [price, setPrice] = useState("60000000");
  return (
    <Container className="max-w-[1040px] pt-4 md:pt-12">
      <PageTitle>{t("Лизинг")}</PageTitle>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        {t("Машины үнээ оруулаад сарын төлбөрөө тооцоолоорой. Тодорхой зар дээрх тооцоолуур тухайн машины үнээр шууд бодно.")}
      </p>
      <div className="grid gap-6 md:mt-8 md:grid-cols-[1fr_400px]">
        <section className="rounded-2xl bg-card p-5 md:p-6">
          <Field label={t("Машины үнэ (₮)")} hint={price ? `${Number(price).toLocaleString("en-US")}₮` : undefined}>
            <input className={inputClass} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-foreground/80">
            <li>• {t("Урьдчилгаа: үнийн {n}%", { n: Math.round(LEASING.downPaymentRate * 100) })}</li>
            <li>• {t("Хугацаа: {terms} сар", { terms: LEASING.terms.join(", ") })}</li>
            <li>• {t("Жишиг хүү: сарын {rate}% — бодит хүү банк, лизингийн компаниас хамаарна", { rate: (LEASING.monthlyRate * 100).toFixed(1) })}</li>
          </ul>
          <Link href="/cars" className="mt-6 inline-block rounded-xl border-[1.5px] border-foreground px-4 py-2.5 text-sm font-bold hover:bg-muted">
            {t("Машин сонгох")}
          </Link>
        </section>
        <LeasingCalculator price={price} />
      </div>
    </Container>
  );
}
