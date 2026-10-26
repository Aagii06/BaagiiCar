"use client";

import { carTitle } from "@/components/car/CarCard";
import CarImage from "@/components/car/CarImage";
import CarPicker from "@/components/car/CarPicker";
import LeasingCalculator from "@/components/car/LeasingCalculator";
import Container, { PageTitle } from "@/components/common/Container";
import { Field, inputClass } from "@/components/common/Field";
import type { Car } from "@/lib/api/types";
import { LEASING } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatPrice } from "@/lib/utils";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

export default function LeasingPage() {
  const { t } = useI18n();
  const [price, setPrice] = useState("60000000");
  // Car picked from the search modal; its price fills the field (still editable).
  const [car, setCar] = useState<Car | null>(null);
  const [picking, setPicking] = useState(false);
  const closePicker = useCallback(() => setPicking(false), []);
  return (
    <Container className="max-w-[1040px] pt-4 md:pt-12">
      <PageTitle>{t("Лизинг")}</PageTitle>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        {t("Машины үнээ оруулаад сарын төлбөрөө тооцоолоорой. Тодорхой зар дээрх тооцоолуур тухайн машины үнээр шууд бодно.")}
      </p>
      <div className="grid gap-6 md:mt-8 md:grid-cols-[1fr_400px]">
        <section className="rounded-2xl bg-card p-5 md:p-6">
          {car && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted p-2">
              <Link href={`/cars/${car.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <CarImage id={car.id} image={car.image} size="thumb" className="h-14 w-20 shrink-0 rounded-lg" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold">
                    {carTitle(car, t)}
                    {car.manufactured_year ? <span className="font-normal text-muted-foreground"> · {car.manufactured_year}</span> : null}
                  </span>
                  <span className="mt-0.5 block text-sm font-bold text-primary">{formatPrice(car.price, t)}</span>
                </span>
              </Link>
              <button type="button" onClick={() => setCar(null)} aria-label={t("Хасах")} className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-border hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          )}
          <Field label={t("Машины үнэ (₮)")} hint={price ? `${Number(price).toLocaleString("en-US")}₮` : undefined}>
            <input className={inputClass} inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} />
          </Field>
          <ul className="mt-6 space-y-3 text-sm leading-6 text-foreground/80">
            <li>• {t("Урьдчилгаа: үнийн {n}%", { n: Math.round(LEASING.downPaymentRate * 100) })}</li>
            <li>• {t("Хугацаа: {terms} сар", { terms: LEASING.terms.join(", ") })}</li>
            <li>• {t("Хүү: анх сарын {rate}% — тооцоолуур дээр өөрийн хүүгээ оруулж болно", { rate: (LEASING.monthlyRate * 100).toFixed(1) })}</li>
          </ul>
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl border-[1.5px] border-foreground px-4 py-2.5 text-sm font-bold hover:bg-muted"
          >
            <Search className="size-4" />
            {car ? t("Өөр машин сонгох") : t("Машин сонгох")}
          </button>
        </section>
        <LeasingCalculator price={price} carId={car?.id} />
      </div>
      {picking && (
        <CarPicker
          title={t("Машин сонгох")}
          isPicked={(id) => id === car?.id}
          onPick={(next) => {
            setCar(next);
            setPrice(String(Math.round(Number(next.price) || 0)));
            closePicker();
          }}
          onClose={closePicker}
        />
      )}
    </Container>
  );
}
