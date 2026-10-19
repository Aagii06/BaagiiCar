"use client";

import type { Car } from "@/lib/api/types";
import { openChat } from "@/lib/chat";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { T } from "@/lib/i18n/translate";
import { cn, formatPriceShort } from "@/lib/utils";
import { BadgeCheck, MapPin, MessageCircle } from "lucide-react";
import Link from "next/link";
import CarImage from "./CarImage";
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

/** Grid card from "Онцлох зарууд" / "Машин авах". */
export default function CarCard({ car, showDescription, featuredBadge }: { car: Car; showDescription?: boolean; featuredBadge?: boolean }) {
  const { t } = useI18n();
  const href = `/cars/${car.id}`;
  return (
    <article className="flex flex-col rounded-2xl bg-card p-3 transition-shadow hover:shadow-lg hover:shadow-black/5">
      <div className="relative">
        <Link href={href} className="block">
          <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} className="aspect-[4/3]" alt={carTitle(car, t)} />
        </Link>
        {featuredBadge && car.is_featured ? <FeaturedBadge className="absolute left-2.5 top-2.5" /> : null}
        {car.status === "sold" && (
          <span className="absolute left-2.5 top-2.5 rounded-full bg-dark px-2.5 py-1 text-[11px] font-bold text-white">{t("Зарагдсан")}</span>
        )}
        {!featuredBadge && <FavoriteButton carId={car.id} className="absolute right-2.5 top-2.5" />}
      </div>

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={href} className="min-w-0">
            <h3 className="font-bold leading-snug hover:text-primary">
              {carTitle(car, t)}
              {car.manufactured_year ? <span className="font-medium text-muted-foreground"> · {car.manufactured_year}</span> : null}
            </h3>
          </Link>
          <span className="shrink-0 font-bold text-primary">{formatPriceShort(car.price, t)}</span>
        </div>

        <SpecChips car={car} className="mt-3" />

        {car.location_name && (
          <p className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-primary">
            <MapPin className="size-3.5" />
            {car.location_name}
          </p>
        )}
        {showDescription && car.description && <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-muted-foreground">{car.description}</p>}

        <div className="mt-auto flex gap-2 pt-4">
          <Link href={href} className="flex h-10 flex-1 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary-hover">
            {t("Дэлгэрэнгүй")}
          </Link>
          <button
            type="button"
            onClick={() => openChat({ carId: car.id, title: carTitle(car, t) })}
            aria-label={t("Зарлагчтай холбогдох")}
            className="grid size-10 place-items-center rounded-xl border-[1.5px] border-primary text-primary hover:bg-primary-soft"
          >
            <MessageCircle className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
