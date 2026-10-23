"use client";

import type { Car } from "@/lib/api/types";
import { openChat } from "@/lib/chat";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatPriceShort } from "@/lib/utils";
import { MessageCircle, Zap } from "lucide-react";
import Link from "next/link";
import { carTitle } from "./CarCard";
import CarImage from "./CarImage";
import CompareButton from "./CompareButton";
import SpecChips from "./SpecChips";

/** The orange-outlined, full-width featured card in the "Машин авах" grid. */
export default function CarWideCard({ car }: { car: Car }) {
  const { t } = useI18n();
  const href = `/cars/${car.id}`;
  return (
    <article className="grid gap-5 rounded-2xl border-[1.5px] border-primary bg-card p-3 sm:col-span-2 md:grid-cols-[1.1fr_1fr] xl:col-span-3">
      <Link href={href}>
        <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} className="aspect-[16/9] h-full md:aspect-auto md:min-h-56" alt={carTitle(car, t)} />
      </Link>
      <div className="flex flex-col px-1 pb-1 md:py-2 md:pr-2">
        <div className="flex items-start justify-between gap-3">
          <Link href={href}>
            <h3 className="text-xl font-bold hover:text-primary">
              {carTitle(car, t)}
              {car.manufactured_year ? <span className="font-medium text-muted-foreground"> · {car.manufactured_year}</span> : null}
            </h3>
          </Link>
          <span className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 font-bold text-white">
            <Zap className="size-4" />
            {formatPriceShort(car.price, t)}
          </span>
        </div>
        <SpecChips car={car} className="mt-4" />
        <div className="mt-auto flex gap-2 pt-5">
          <Link href={href} className="flex h-11 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-hover">
            {t("Дэлгэрэнгүй")}
          </Link>
          <button
            type="button"
            onClick={() => openChat({ carId: car.id, title: carTitle(car, t) })}
            aria-label={t("Зарлагчтай холбогдох")}
            className="grid size-11 place-items-center rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary-soft"
          >
            <MessageCircle className="size-4" />
          </button>
          <CompareButton carId={car.id} className="size-11" />
        </div>
      </div>
    </article>
  );
}
