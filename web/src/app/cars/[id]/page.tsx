"use client";

import CarArt, { shapeFor } from "@/components/car/CarArt";
import { carTitle } from "@/components/car/CarCard";
import CarImage from "@/components/car/CarImage";
import FavoriteButton from "@/components/car/FavoriteButton";
import LeasingCalculator from "@/components/car/LeasingCalculator";
import Container from "@/components/common/Container";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { getCar, getCarFiles, searchCars } from "@/lib/api/cars";
import { uploadUrl } from "@/lib/api/config";
import type { Car } from "@/lib/api/types";
import { bodyTypeLabel } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatEngine, formatNumber, formatPrice, initials, timeAgo, tintFor } from "@/lib/utils";
import { ChevronLeft, ChevronRight, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

function Gallery({ car }: { car: Car }) {
  const { t } = useI18n();
  const files = useApi(() => getCarFiles(car.id), String(car.id));
  const photos = (files.data ?? []).map((f) => f.generated_name).filter(Boolean) as string[];
  const [index, setIndex] = useState(0);
  const total = photos.length;
  const current = photos[Math.min(index, Math.max(total - 1, 0))];
  const go = (d: number) => setIndex((i) => (i + d + total) % total);

  return (
    <section className="rounded-2xl bg-card p-3">
      <div className={cn("relative grid aspect-[16/10] place-items-center overflow-hidden rounded-xl", tintFor(car.id))}>
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element -- backend-served uploads
          <img src={uploadUrl(current, "full")!} alt={carTitle(car, t)} className="absolute inset-0 size-full object-cover" />
        ) : (
          <CarArt shape={shapeFor(car.body_type_name)} className="w-[58%]" strokeWidth={1.6} />
        )}
        {total > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label={t("Өмнөх зураг")} className="absolute left-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white shadow">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => go(1)} aria-label={t("Дараах зураг")} className="absolute right-4 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white shadow">
              <ChevronRight className="size-5" />
            </button>
          </>
        )}
        {total > 0 && (
          <span className="absolute bottom-4 right-4 rounded-full bg-dark px-2.5 py-1 text-xs font-bold text-white">
            {Math.min(index, total - 1) + 1} / {total}
          </span>
        )}
      </div>
      {total > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {photos.map((name, i) => (
            <button
              key={name}
              onClick={() => setIndex(i)}
              aria-label={t("Зураг {n}", { n: i + 1 })}
              className={cn("h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 md:h-20 md:w-32", i === index ? "border-foreground" : "border-transparent")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- backend-served uploads */}
              <img src={uploadUrl(name, "thumb")!} alt="" className="size-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Specs({ car }: { car: Car }) {
  const { t, tv } = useI18n();
  const specs: [string, string | number | null | undefined][] = [
    [t("Үйлдвэрлэсэн он"), car.manufactured_year],
    [t("Орж ирсэн он"), car.imported_year],
    [t("Гүйлт"), car.mileage != null ? t("{n} км", { n: formatNumber(car.mileage) }) : null],
    [t("Хөдөлгүүр"), car.engine_capacity ? formatEngine(car.engine_capacity, t) : null],
    [t("Түлш"), tv(car.fuel_type)],
    [t("Хурдны хайрцаг"), tv(car.transmission)],
    [t("Хүрд"), tv(car.steering)],
    [t("Хөтлөгч"), car.drive_type],
    [t("Өнгө"), car.color],
    [t("Төрөл"), bodyTypeLabel(car.body_type_name, t)],
  ];
  return (
    <section className="rounded-2xl bg-card p-5 md:p-6">
      <h2 className="text-lg font-bold">{t("Үзүүлэлт")}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {specs.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted px-3 py-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 truncate font-bold">{value || "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Similar({ car }: { car: Car }) {
  const { t, tv } = useI18n();
  const similar = useApi(
    () =>
      searchCars({ bodyTypeId: car.body_type_id ?? undefined, brandIds: car.body_type_id ? undefined : [car.brand_id], pageSize: 5 }).then((r) =>
        r.rows.filter((c) => c.id !== car.id).slice(0, 4)
      ),
    String(car.id)
  );
  if (!similar.data?.length) return null;
  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-[30px]">{t("Төстэй машинууд")}</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {similar.data.map((c) => (
          <Link key={c.id} href={`/cars/${c.id}`} className="rounded-2xl bg-card p-3 transition-shadow hover:shadow-lg hover:shadow-black/5">
            <CarImage id={c.id} image={c.image} bodyType={c.body_type_name} className="aspect-[16/10]" />
            <div className="px-1 pb-1 pt-3">
              <p className="font-bold">{carTitle(c, t)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[c.manufactured_year, c.mileage != null && t("{n} км", { n: formatNumber(c.mileage) }), tv(c.fuel_type)].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-2 font-bold text-primary">{formatPrice(c.price, t)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const car = useApi(() => getCar(id), id);

  if (car.loading && !car.data) return <LoadingState className="min-h-[60vh]" />;
  if (car.error) return <Container className="pt-10"><ErrorState message={car.error.message} onRetry={car.reload} /></Container>;
  if (!car.data || car.data.status === "deleted")
    return (
      <Container className="pt-10">
        <EmptyState title={t("Зар олдсонгүй")} description={t("Зар устгагдсан эсвэл хаяг буруу байна.")} action={<Link href="/cars" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">{t("Бусад зар үзэх")}</Link>} />
      </Container>
    );

  const c = car.data;
  const phone = c.phonenumber || c.seller_phone;
  const sold = c.status === "sold";

  return (
    <Container className="pt-6">
      <nav aria-label={t("Зам")} className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{t("Нүүр")}</Link>/
        {c.body_type_id ? (
          <Link href={`/cars?body=${c.body_type_id}`} className="hover:text-foreground">{bodyTypeLabel(c.body_type_name, t)}</Link>
        ) : (
          <Link href="/cars" className="hover:text-foreground">{t("Машин")}</Link>
        )}
        /<span className="font-medium text-foreground">{carTitle(c, t)}</span>
      </nav>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-5">
          <Gallery car={c} />
          <div className="lg:hidden">
            <Summary car={c} phone={phone} sold={sold} />
          </div>
          <Specs car={c} />
          {c.description && (
            <section className="rounded-2xl bg-card p-5 md:p-6">
              <h2 className="text-lg font-bold">{t("Тайлбар")}</h2>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-7 text-foreground/80">{c.description}</p>
            </section>
          )}
          <div className="lg:hidden">
            <LeasingCalculator price={c.price} carId={c.id} />
          </div>
        </div>

        <div className="hidden space-y-5 lg:block">
          <div className="sticky top-24 space-y-5">
            <Summary car={c} phone={phone} sold={sold} />
            <LeasingCalculator price={c.price} carId={c.id} />
          </div>
        </div>
      </div>

      <Similar car={c} />
    </Container>
  );
}

function Summary({ car: c, phone, sold }: { car: Car; phone: string | null; sold: boolean }) {
  const { t } = useI18n();
  return (
    <section className="rounded-2xl bg-card p-5 md:p-6">
      <div className="flex flex-wrap gap-2">
        {sold && <span className="rounded-full bg-dark px-2.5 py-1 text-[11px] font-bold text-white">{t("Зарагдсан")}</span>}
        {c.is_featured ? <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">{t("Онцлох")}</span> : null}
        <span className="rounded-full bg-amber-soft px-2.5 py-1 text-[11px] font-bold text-amber-ink">{t("Лизинг боломжтой")}</span>
      </div>
      <h1 className="mt-4 font-display text-[28px] font-bold leading-tight tracking-tight">
        {carTitle(c, t)} {c.manufactured_year}
      </h1>
      <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-primary">
        <MapPin className="size-3.5" />
        {[c.location_name, timeAgo(c.created_at, t)].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-4 text-[28px] font-bold">{formatPrice(c.price, t)}</p>

      <div className="mt-4 flex gap-2">
        <Link href={`/chat?car=${c.id}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover">
          <MessageCircle className="size-4" />
          {t("Чатлах")}
        </Link>
        {phone && (
          <a href={`tel:${phone}`} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border-[1.5px] border-foreground font-bold hover:bg-muted">
            <Phone className="size-4" />
            {phone}
          </a>
        )}
        <FavoriteButton carId={c.id} className="size-12 rounded-xl border border-border shadow-none" />
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
        <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{initials(c.seller_name)}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{c.seller_name || t("Зарлагч")}</p>
          <p className="text-xs text-muted-foreground">{t("Зарлагч")}</p>
        </div>
        <span className="text-xs text-muted-foreground">{t("{n} үзсэн", { n: c.view_count ?? 0 })}</span>
      </div>
    </section>
  );
}
