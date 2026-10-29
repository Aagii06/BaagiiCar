"use client";

import type { Car } from "@/lib/api/types";
import { openChat } from "@/lib/chat";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { formatPriceShort } from "@/lib/utils";
import { MessageCircle, Zap } from "lucide-react";
import Link from "next/link";
import { carTitle, FeaturedBadge } from "./CarCard";
import CarImage from "./CarImage";
import CompareButton from "./CompareButton";
import PhoneButton from "./PhoneButton";
import SpecChips from "./SpecChips";

/** The orange-outlined, full-width featured card in the "Машин авах" grid. */
export default function CarWideCard({ car }: { car: Car }) {
  const { t } = useI18n();
  const href = `/cars/${car.id}`;
  const phone = car.phonenumber || car.seller_phone;
  return (
    <article className="grid gap-5 rounded-2xl border-[1.5px] border-primary bg-card p-3 sm:col-span-2 md:grid-cols-[1.1fr_1fr] xl:col-span-3">
      <Link href={href} className="relative">
        {car.is_featured ? <FeaturedBadge className="absolute left-2.5 top-2.5 z-10" /> : null}
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
          <Link href={href} className="flex h-10 flex-1 items-center justify-center rounded-xl bg-primary text-[13px] font-medium text-white hover:bg-primary-hover">
            {t("Дэлгэрэнгүй")}
          </Link>
          {phone && <PhoneButton car={car} phone={phone} variant="icon" className="size-10 [&_svg]:size-3.5" />}
          <button
            type="button"
            onClick={() => openChat({ carId: car.id, title: carTitle(car, t) })}
            aria-label={t("Зарлагчтай холбогдох")}
            className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary transition-colors hover:bg-primary hover:text-white"
          >
            <MessageCircle className="size-3.5" />
          </button>
          <CompareButton carId={car.id} className="size-10 [&_svg]:size-3.5" />
        </div>
      </div>
    </article>
  );
}
