"use client";

import { carTitle } from "@/components/car/CarCard";
import CarImage from "@/components/car/CarImage";
import CompareButton from "@/components/car/CompareButton";
import FavoriteButton from "@/components/car/FavoriteButton";
import PhoneButton from "@/components/car/PhoneButton";
import LeasingCalculator from "@/components/car/LeasingCalculator";
import Container from "@/components/common/Container";
import ShareButtons from "@/components/car/ShareButtons";
import PhotoViewer from "@/components/common/PhotoViewer";
import { EmptyState, ErrorState } from "@/components/common/States";
import DealerAvatar from "@/components/common/DealerAvatar";
import Img from "@/components/common/Img";
import { getCar, getCarFiles, searchCars } from "@/lib/api/cars";
import { uploadUrl } from "@/lib/api/config";
import type { Car } from "@/lib/api/types";
import { openChat } from "@/lib/chat";
import { bodyTypeLabel } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatEngine, formatNumber, formatPrice, initials, timeAgo } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Eye, MapPin, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useRouteId } from "@/lib/useRouteId";
import { useWheelScrollX } from "@/lib/useWheelScrollX";
import { useEffect, useState } from "react";

function Gallery({ car }: { car: Car }) {
  const { t } = useI18n();
  const files = useApi(() => getCarFiles(car.id), String(car.id));
  // Photos whose file is missing on the server are dropped; if none are left the default picture shows.
  const [broken, setBroken] = useState<string[]>([]);
  const photos = (files.data ?? []).map((f) => f.generated_name).filter((n): n is string => !!n && !broken.includes(n));
  const drop = (name: string) => () => setBroken((cur) => (cur.includes(name) ? cur : [...cur, name]));
  const [rawIndex, setIndex] = useState(0);
  const [viewing, setViewing] = useState<number | null>(null);
  const total = photos.length;
  const index = Math.min(rawIndex, Math.max(total - 1, 0));
  const alt = carTitle(car, t);

  if (!total)
    return (
      // No photos (or still loading): the cover photo if any, else the default picture.
      <CarImage id={car.id} image={car.image} size="full" className="-mx-4 aspect-[4/3] rounded-none md:mx-0 md:aspect-auto md:h-[520px] md:rounded-2xl" />
    );

  const counter = (
    <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-dark/80 px-2.5 py-1 text-xs font-bold text-white">
      {index + 1} / {total}
    </span>
  );

  return (
    <section>
      {/* Mobile: edge-to-edge swipe between photos, dots show how many there are. */}
      <div className="-mx-4 md:hidden">
        <div className="relative">
          <div
            onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto bg-card"
          >
            {photos.map((name, i) => (
              <button key={name} type="button" onClick={() => setViewing(i)} aria-label={t("Зураг томоор харах")} className="aspect-[4/3] w-full shrink-0 snap-center">
                <Img src={uploadUrl(name, "grid")!} alt={i ? "" : alt} loading={i ? "lazy" : undefined} onError={drop(name)} className="size-full object-contain" />
              </button>
            ))}
          </div>
          {counter}
        </div>
        {total > 1 && (
          <div className="mt-2.5 flex justify-center gap-1.5">
            {photos.map((name, i) => (
              <span key={name} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-foreground" : "w-1.5 bg-foreground/25")} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop: smaller main photo with a thumbnail column beside it. */}
      <div className="hidden h-[520px] gap-2 md:flex">
        <button type="button" onClick={() => setViewing(index)} aria-label={t("Зураг томоор харах")} className="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-card">
          <Img src={uploadUrl(photos[index], "full")!} alt={alt} onError={drop(photos[index])} className="size-full object-contain" />
          {counter}
        </button>
        {total > 1 && (
          <div className="no-scrollbar flex w-28 shrink-0 flex-col gap-2 overflow-y-auto lg:w-32">
            {photos.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={t("Зураг {n}", { n: i + 1 })}
                className={cn("aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg border-2", i === index ? "border-foreground" : "border-transparent opacity-80 hover:opacity-100")}
              >
                <Img src={uploadUrl(name, "thumb")!} onError={drop(name)} className="size-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {viewing !== null && <PhotoViewer urls={photos.map((n) => uploadUrl(n, "full")!)} start={viewing} onClose={() => setViewing(null)} />}
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
    [t("Зориулалт"), car.vehicle_type],
    [t("Улсын дугаар"), tv(car.plate_type)],
    [t("Гадна өнгө"), car.color],
    [t("Дотор өнгө"), car.interior_color],
    [t("Лизинг"), t(Number(car.is_leasing) ? "Боломжтой" : "Боломжгүй")],
    [t("Төрөл"), bodyTypeLabel(car.body_type_name, t)],
  ];
  return (
    <section className="rounded-2xl bg-card p-5 md:p-6">
      <h2 className="text-lg font-bold">{t("Үзүүлэлт")}</h2>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {specs.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-muted px-3 py-2.5">
            <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 break-words font-bold">{value || "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const SIMILAR_COUNT = 12;

function Similar({ car }: { car: Car }) {
  const { t } = useI18n();
  const similar = useApi(
    () =>
      searchCars({ bodyTypeId: car.body_type_id ?? undefined, brandIds: car.body_type_id ? undefined : [car.brand_id], pageSize: SIMILAR_COUNT + 1 }).then((r) =>
        r.rows.filter((c) => c.id !== car.id).slice(0, SIMILAR_COUNT)
      ),
    String(car.id)
  );
  if (!similar.data?.length) return null;
  return (
    <section className="mt-14">
      <h2 className="font-display text-2xl font-bold tracking-tight md:text-[30px]">{t("Төстэй машинууд")}</h2>
      <SimilarRow cars={similar.data} />
    </section>
  );
}

/** Sideways-scrolling row of cards; mounted with its cars so the wheel hook finds the element. */
function SimilarRow({ cars }: { cars: Car[] }) {
  const { t, tv } = useI18n();
  const rowRef = useWheelScrollX<HTMLDivElement>();
  const scrollBy = (dir: 1 | -1) => rowRef.current?.scrollBy({ left: dir * rowRef.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative mt-6">
      <div ref={rowRef} className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:scroll-px-0 md:px-0">
        {cars.map((c) => (
          <Link
            key={c.id}
            href={`/cars/${c.id}`}
            className="w-[72%] shrink-0 snap-start rounded-2xl bg-card p-3 transition-shadow hover:shadow-lg hover:shadow-black/5 sm:w-[calc((100%-1rem)/2.3)] lg:w-[calc((100%-3rem)/4.3)]"
          >
            <CarImage id={c.id} image={c.image} bodyType={c.body_type_name} className="aspect-[16/10]" />
            <div className="px-1 pb-1 pt-3">
              <p className="truncate font-bold">{carTitle(c, t)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {[c.manufactured_year, c.mileage != null && t("{n} км", { n: formatNumber(c.mileage) }), tv(c.fuel_type)].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-2 font-bold text-primary">{formatPrice(c.price, t)}</p>
            </div>
          </Link>
        ))}
      </div>
      {cars.length > 4 && (
        <>
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label={t("Өмнөх")}
            className="absolute -left-5 top-[38%] hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg shadow-black/10 hover:bg-muted md:grid"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label={t("Дараах")}
            className="absolute -right-5 top-[38%] hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white shadow-lg shadow-black/10 hover:bg-muted md:grid"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
    </div>
  );
}

/** Grey photo, summary and specs shaped like the ad page while it loads. */
function DetailSkeleton() {
  return (
    <Container className="animate-pulse md:pt-6">
      <div className="hidden h-5 w-64 rounded bg-card md:block" />
      <div className="grid gap-3 md:mt-5 md:gap-5 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-3 md:space-y-5">
          <div className="-mx-4 aspect-[4/3] bg-muted md:mx-0 md:aspect-auto md:h-[520px] md:rounded-2xl" />
          <SummarySkeleton className="lg:hidden" />
          <section className="rounded-2xl bg-card p-5 md:p-6">
            <div className="h-5 w-28 rounded bg-muted" />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className="h-[62px] rounded-xl bg-muted" />
              ))}
            </div>
          </section>
        </div>
        <SummarySkeleton className="hidden lg:block" />
      </div>
    </Container>
  );
}

function SummarySkeleton({ className }: { className?: string }) {
  return (
    <section className={cn("rounded-2xl bg-card p-5 md:p-6", className)}>
      <div className="flex gap-2">
        <div className="h-6 w-16 rounded-full bg-muted" />
        <div className="h-6 w-28 rounded-full bg-muted" />
      </div>
      <div className="mt-4 h-8 w-3/4 rounded bg-muted" />
      <div className="mt-3 h-9 w-1/2 rounded bg-muted" />
      <div className="mt-5 h-12 rounded-xl bg-muted" />
    </section>
  );
}

export default function CarDetailPage() {
  const id = useRouteId();
  const { t } = useI18n();
  const car = useApi(() => getCar(id), id);

  // Every /cars/<id> is the same exported page ("_"), so the router sees
  // /cars/1 -> /cars/2 (e.g. from "Төстэй машинууд") as no route change and
  // keeps the scroll position. Jump to the top ourselves.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (car.loading && !car.data) return <DetailSkeleton />;
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
    // key: reset gallery/leasing state when moving to another car.
    <Container key={c.id} className="md:pt-6">
      {/* Phones: the app bar's back arrow replaces the breadcrumb. */}
      <nav aria-label={t("Зам")} className="hidden flex-wrap md:flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{t("Нүүр")}</Link>/
        {c.body_type_id ? (
          <Link href={`/cars?body=${c.body_type_id}`} className="hover:text-foreground">{bodyTypeLabel(c.body_type_name, t)}</Link>
        ) : (
          <Link href="/cars" className="hover:text-foreground">{t("Машин")}</Link>
        )}
        /<span className="font-medium text-foreground">{carTitle(c, t)}</span>
      </nav>

      <div className="grid gap-3 md:mt-5 md:gap-5 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-3 md:space-y-5">
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
      <ActionBar car={c} phone={phone} />
    </Container>
  );
}

/** Phones: app-style bottom bar (in place of the tab bar) with the ad's actions. */
function ActionBar({ car: c, phone }: { car: Car; phone: string | null }) {
  const { t } = useI18n();
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-border bg-white px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 md:hidden">
      <FavoriteButton carId={c.id} className="size-12 shrink-0 rounded-xl border border-border shadow-none" />
      <CompareButton carId={c.id} className="size-12" />
      <button
        onClick={() => openChat({ carId: c.id, title: `${carTitle(c, t)} ${c.manufactured_year ?? ""}`.trim() })}
        aria-label={t("Чатлах")}
        className={cn(
          "flex h-12 items-center justify-center gap-2 rounded-xl font-bold",
          phone ? "w-12 shrink-0 border-[1.5px] border-primary text-primary" : "flex-1 bg-primary text-white"
        )}
      >
        <MessageCircle className="size-5" />
        {!phone && t("Чатлах")}
      </button>
      {phone && <PhoneButton car={c} phone={phone} compact className="h-12 flex-1 rounded-xl bg-primary text-white" />}
    </div>
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

      {/* Phones: these live in the fixed ActionBar at the bottom. */}
      <div className="mt-4 hidden gap-2 md:flex">
        <button
          onClick={() => openChat({ carId: c.id, title: `${carTitle(c, t)} ${c.manufactured_year ?? ""}`.trim() })}
          title={t("Чатлах")}
          aria-label={t("Чатлах")}
          className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-white hover:bg-primary-hover"
        >
          <MessageCircle className="size-5" />
        </button>
        {phone && <PhoneButton car={c} phone={phone} className="h-12 flex-1 rounded-xl border-[1.5px] border-foreground hover:bg-muted" />}
        <FavoriteButton carId={c.id} className="size-12 rounded-xl border border-border shadow-none" />
        <CompareButton carId={c.id} className="size-12" />
      </div>

      <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
        {c.dealer_id && c.dealer_name ? (
          // Dealer ad: logo + name open the dealer's page.
          <Link href={`/dealers?d=${c.dealer_id}`} className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80">
            <DealerAvatar
              logo={c.dealer_logo}
              name={c.dealer_name}
              imgClassName="size-11 shrink-0 rounded-full border border-border bg-white object-contain p-1"
              letterClassName="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-bold">{c.dealer_name}</span>
              <span className="block text-xs text-muted-foreground">{t("Дилер")}</span>
            </span>
          </Link>
        ) : (
          <>
            <span className="grid size-11 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">{initials(c.seller_name)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{c.seller_name || t("Зарлагч")}</p>
              <p className="text-xs text-muted-foreground">{t("Зарлагч")}</p>
            </div>
          </>
        )}
        <span className="flex shrink-0 items-center gap-3 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1" title={t("Зар үзсэн")}>
            <Eye className="size-3.5" aria-hidden />
            <span className="sr-only">{t("Зар үзсэн")}</span>
            {c.view_count ?? 0}
          </span>
          <span className="flex items-center gap-1" title={t("Дугаар харсан")}>
            <Phone className="size-3.5" aria-hidden />
            <span className="sr-only">{t("Дугаар харсан")}</span>
            {c.phone_view_count ?? 0}
          </span>
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-5">
        <span className="text-sm font-semibold text-muted-foreground">{t("Хуваалцах")}</span>
        <ShareButtons title={`${carTitle(c, t)} ${c.manufactured_year ?? ""}`.trim()} />
      </div>
    </section>
  );
}
