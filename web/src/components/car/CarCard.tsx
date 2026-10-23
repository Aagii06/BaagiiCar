"use client";

import type { Car } from "@/lib/api/types";
import { openChat } from "@/lib/chat";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { T } from "@/lib/i18n/translate";
import { cn, formatNumber, formatPriceShort } from "@/lib/utils";
import { BadgeCheck, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import CarImage from "./CarImage";
import CompareButton from "./CompareButton";
import FavoriteButton from "./FavoriteButton";
import SpecChips from "./SpecChips";

export function carTitle(car: Car, t: T) {
  return [car.brand_name, car.model_name].filter(Boolean).join(" ") || car.name || t("Машин");
}

export function FeaturedBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-success", className)}>
      <BadgeCheck className="size-3.5" />
      {t("Онцлох")}
    </span>
  );
}

/** Grid card from "Онцлох зарууд" / "Машин авах"; on phones a compact row (photo left) so several fit on screen. */
export default function CarCard({ car, featuredBadge }: { car: Car; featuredBadge?: boolean }) {
  const { t } = useI18n();
  const href = `/cars/${car.id}`;
  return (
    <article className="flex gap-3 rounded-2xl bg-card p-2.5 transition-shadow hover:shadow-lg hover:shadow-black/5 sm:flex-col sm:gap-0 sm:p-3">
      <div className="relative w-[42%] max-w-44 shrink-0 self-start sm:w-auto sm:max-w-none">
        <Link href={href} className="block">
          <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} className="aspect-[4/3]" alt={carTitle(car, t)} />
        </Link>
        {featuredBadge && car.is_featured ? <FeaturedBadge className="absolute left-1.5 top-1.5 sm:left-2.5 sm:top-2.5" /> : null}
        {car.status === "sold" && (
          <span className="absolute left-1.5 top-1.5 rounded-full bg-dark sm:left-2.5 sm:top-2.5 px-2.5 py-1 text-[11px] font-bold text-white">{t("Зарагдсан")}</span>
        )}
        <FavoriteButton carId={car.id} className="absolute right-1.5 top-1.5 size-8 sm:right-2.5 sm:top-2.5 sm:size-9" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col sm:px-1 sm:pb-1 sm:pt-3">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <Link href={href} className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-bold leading-snug hover:text-primary sm:text-base">
              {carTitle(car, t)}
              {car.manufactured_year ? <span className="font-medium text-muted-foreground"> · {car.manufactured_year}</span> : null}
            </h3>
          </Link>
          <span className="shrink-0 font-bold text-primary">{formatPriceShort(car.price, t)}</span>
        </div>

        {/* Phones: one muted line instead of the mileage strip and location row. */}
        <p className="mt-1 truncate text-xs text-muted-foreground sm:hidden">
          {[car.mileage != null ? t("{n} км", { n: formatNumber(car.mileage) }) : null, car.location_name].filter(Boolean).join(" · ")}
        </p>

        <SpecChips car={car} className="mt-3 hidden sm:flex" />

        {car.location_name && (
          <p className="mt-3 hidden items-center gap-1.5 text-[13px] font-semibold text-primary sm:flex">
            <MapPin className="size-3.5" />
            {car.location_name}
          </p>
        )}

        {/* Phones: no "Дэлгэрэнгүй" — the photo and title already open the ad. */}
        <div className="mt-auto flex gap-2 pt-2 sm:pt-4">
          <Link href={href} className="hidden h-10 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-bold sm:flex text-white hover:bg-primary-hover">
            {t("Дэлгэрэнгүй")}
          </Link>
          <button
            type="button"
            onClick={() => openChat({ carId: car.id, title: carTitle(car, t) })}
            aria-label={t("Зарлагчтай холбогдох")}
            className="grid size-9 shrink-0 place-items-center rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary-soft sm:size-10"
          >
            <MessageCircle className="size-4" />
          </button>
          <CompareButton carId={car.id} className="size-9 sm:size-10" />
        </div>
      </div>
    </article>
  );
}
