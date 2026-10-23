"use client";

import CarArt, { shapeFor } from "@/components/car/CarArt";
import CarCard from "@/components/car/CarCard";
import Container, { SectionTitle, ViewAll } from "@/components/common/Container";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import HeroCarousel from "@/components/home/HeroCarousel";
import HeroSearch from "@/components/home/HeroSearch";
import Img from "@/components/common/Img";
import { featuredCars, getBodyTypes, getBrands, searchCars } from "@/lib/api/cars";
import { catalogImage } from "@/lib/api/config";
import type { BodyType } from "@/lib/api/types";
import type { MessageKey } from "@/lib/i18n/messages";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { T } from "@/lib/i18n/translate";
import { bodyTypeLabel } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ArrowRight, CreditCard, Heart, LifeBuoy, Search } from "lucide-react";
import Link from "next/link";

const MLN = 1_000_000;

const QUICK: { icon: typeof Search; tint: string; title: MessageKey; text: MessageKey; href: string }[] = [
  { icon: Search, tint: "bg-tint-blue text-[#2b7bd8]", title: "Машин хайх", text: "Бүх зарыг шүүж үзэх", href: "/cars" },
  { icon: LifeBuoy, tint: "bg-tint-peach text-primary", title: "Тусламж", text: "Түгээмэл асуулт, холбоо барих", href: "/help" },
  { icon: CreditCard, tint: "bg-tint-lavender text-[#6b4fd8]", title: "Лизинг", text: "Сарын төлбөрөө тооцоолох", href: "/leasing" },
  { icon: Heart, tint: "bg-tint-rose text-destructive", title: "Хадгалсан", text: "Таалагдсан машинууд", href: "/saved" },
];

const BUDGETS = [
  { min: 0, max: 30, tint: "bg-tint-blue" },
  { min: 30, max: 60, tint: "bg-tint-lavender" },
  { min: 60, max: 100, tint: "bg-tint-rose" },
  { min: 100, max: 0, tint: "bg-tint-mint" },
];

function budgetLabel({ min, max }: { min: number; max: number }, t: T) {
  if (!min) return t("{n} сая хүртэл", { n: max });
  if (!max) return t("{n} сая +", { n: min });
  return t("{a} – {b} сая", { a: min, b: max });
}

const STEPS: { n: string; title: MessageKey; text: MessageKey }[] = [
  { n: "01", title: "Хайх", text: "Үйлдвэр, загвар, он, үнээр шүүнэ." },
  { n: "02", title: "Харьцуулах", text: "Зураг, үзүүлэлтийг нь сайтар үзнэ." },
  { n: "03", title: "Холбогдох", text: "Зарлагч руу шууд залгаж тохирно." },
];

function Hero({ bodyTypes }: { bodyTypes: BodyType[] }) {
  return (
    <section className="relative">
      <HeroCarousel bodyTypes={bodyTypes} className="h-[520px] lg:h-[560px]" />
      {/* Phones / tablets: below the photo with a slight overlap. Desktop: floats over its bottom edge. */}
      <Container className="relative z-10 -mt-12 lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:translate-y-[38%]">
        <HeroSearch />
      </Container>
    </section>
  );
}

function BrandGrid() {
  const { t } = useI18n();
  const brands = useApi(getBrands);
  const loading = brands.loading && !brands.data;
  if (!loading && !brands.data?.length) return null;
  return (
    <Container className="mt-20 md:mt-28">
      <SectionTitle kicker={t("Бүх үйлдвэр")} light={t("Машины")} bold={t("үйлдвэр")} action={<ViewAll href="/cars" />} />
      <div className="mt-8 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
        {loading &&
          Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className={cn("h-16 animate-pulse items-center justify-center rounded-xl bg-card", i < 8 ? "flex" : i < 12 ? "hidden sm:flex" : "hidden lg:flex")}
            >
              <div className="size-8 rounded-md bg-muted" />
            </div>
          ))}
        {(brands.data ?? []).slice(0, 16).map((b, i) => {
          const logo = catalogImage(b.logo, "brands");
          return (
            <Link
              key={b.id}
              href={`/cars?brand=${b.id}`}
              title={b.name}
              aria-label={b.name}
              className={cn(
                "group flex-col items-center justify-center rounded-xl bg-card p-3 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/5",
                // 4×2 on phones, 6×2 on tablets, the full 16 from lg up.
                i < 8 ? "flex" : i < 12 ? "hidden sm:flex" : "hidden lg:flex"
              )}
            >
              <span className="grid size-10 place-items-center">
                {logo ? (
                  <Img
                    src={logo}
                    loading="lazy"
                    placeholderClassName="size-8 rounded-md"
                    className="max-h-8 max-w-8 object-contain opacity-80 grayscale transition group-hover:opacity-100 group-hover:grayscale-0"
                  />
                ) : (
                  <span className="font-display text-2xl font-bold text-foreground/70">{b.name[0]}</span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}

const TINTS = ["bg-tint-blue", "bg-tint-lavender", "bg-tint-rose", "bg-tint-mint", "bg-tint-peach"];

function BodyTypes({ items, loading }: { items: BodyType[]; loading: boolean }) {
  const { t } = useI18n();
  if (!loading && !items.length) return null;
  return (
    <Container className="mt-20 md:mt-28">
      <SectionTitle kicker={t("Төрөл")} light={t("Төрлөөр")} bold={t("хайх")} />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {loading &&
          Array.from({ length: 4 }, (_, i) => <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-card md:h-[120px]" />)}
        {items.map((b, i) => {
          const image = catalogImage(b.image, "bodyTypes");
          return (
            <Link
              key={b.id}
              href={`/cars?body=${b.id}`}
              className={cn("group relative flex items-center gap-3 overflow-hidden rounded-2xl p-5 md:p-6", TINTS[i % TINTS.length])}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-display text-xl font-semibold md:text-2xl">{bodyTypeLabel(b.name, t)}</span>
                <span className="mt-1 block text-sm text-foreground/60">{t("{n} машин", { n: b.car_count ?? 0 })}</span>
              </span>
              {image ? (
                <Img
                  src={image}
                  loading="lazy"
                  placeholderClassName="h-12 w-20 rounded-md"
                  className="h-12 w-20 shrink-0 object-contain transition-transform group-hover:scale-105 md:h-14 md:w-24"
                />
              ) : (
                <CarArt shape={shapeFor(b.name)} className="w-16 shrink-0 text-foreground/70 md:w-20" strokeWidth={2.2} />
              )}
            </Link>
          );
        })}
      </div>
    </Container>
  );
}

function Budgets() {
  const { t } = useI18n();
  const counts = useApi(() =>
    Promise.all(
      BUDGETS.map((b) =>
        searchCars({ priceMin: b.min ? b.min * MLN : undefined, priceMax: b.max ? b.max * MLN : undefined, pageSize: 1 }).then((r) => r.count)
      )
    )
  );
  return (
    <Container className="mt-20 md:mt-28">
      <SectionTitle light={t("Төсвөөрөө")} bold={t("сонго")} />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {BUDGETS.map((b, i) => {
          const q = new URLSearchParams();
          if (b.min) q.set("priceMin", String(b.min));
          if (b.max) q.set("priceMax", String(b.max));
          return (
            <Link key={b.min} href={`/cars?${q}`} className={cn("group relative overflow-hidden rounded-2xl p-5 md:p-6", b.tint)}>
              <p className="font-display text-xl font-semibold md:text-2xl">{budgetLabel(b, t)}</p>
              <p className="mt-1 text-sm text-foreground/60">{counts.data ? t("{n} машин", { n: counts.data[i] }) : " "}</p>
            </Link>
          );
        })}
      </div>
    </Container>
  );
}

export default function HomePage() {
  const { t } = useI18n();
  const bodyTypes = useApi(getBodyTypes);
  const featured = useApi(() => featuredCars(6));

  return (
    <>
      <Hero bodyTypes={bodyTypes.data ?? []} />

      {/* Space for the overlapping search card (taller when it stacks). */}
      <div className="hidden h-[80px] lg:block" />

      <Container className="mt-10">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK.map(({ icon: Icon, tint, title, text, href }) => (
            <Link key={title} href={href} className="group flex items-center gap-4 rounded-2xl bg-card p-4 transition hover:shadow-xl hover:shadow-black/5 md:p-5">
              <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", tint)}>
                <Icon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-base font-semibold md:text-lg">{t(title)}</span>
                <span className="hidden text-xs text-muted-foreground sm:block">{t(text)}</span>
              </span>
              <ArrowRight className="ml-auto hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-1 md:block" />
            </Link>
          ))}
        </div>
      </Container>

      <Container className="mt-20 md:mt-28">
        <SectionTitle kicker={t("Онцлох")} light={t("Онцлох")} bold={t("машинууд")} action={<ViewAll href="/cars" />} />
        <div className="mt-8">
          {featured.loading && !featured.data ? (
            <CardGridSkeleton count={3} />
          ) : featured.error ? (
            <ErrorState message={featured.error.message} onRetry={featured.reload} />
          ) : featured.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.data.map((car) => (
                <CarCard key={car.id} car={car} featuredBadge />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t("Одоогоор зар алга")}
            />
          )}
        </div>
      </Container>

      <BrandGrid />

      <BodyTypes items={bodyTypes.data ?? []} loading={bodyTypes.loading && !bodyTypes.data} />

      <Budgets />

      {/* Full-bleed banner, like the reference's "Don't dream it, drive it". */}
      <section className="relative mt-20 overflow-hidden bg-[linear-gradient(110deg,#eef3f8_0%,#f8fafc_55%,#e6eef6_100%)] md:mt-28">
        <CarArt className="pointer-events-none absolute -right-16 bottom-0 hidden w-[46%] text-foreground/10 lg:block" strokeWidth={1.2} />
        <Container className="relative grid gap-10 py-16 md:py-24 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <p className="kicker">{t("Машин авах")}</p>
            <h2 className="mt-3 font-display text-[44px] font-light leading-[0.98] md:text-[64px]">
              {t("Мөрөөдөх биш,")}
              <br />
              <span className="font-bold text-primary">{t("жолоод")}</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-foreground/70">{t("Зарыг шүүж, тохирохоо сонгоод зарлагчтай шууд холбогдоорой.")}</p>
            <Link href="/cars" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-dark px-6 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white hover:bg-dark-2">
              {t("Машин хайх")}
              <ArrowRight className="size-4" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl bg-white p-6 shadow-xl shadow-black/5">
                <p className="font-display text-4xl font-bold text-primary">{s.n}</p>
                <p className="mt-4 font-display text-lg font-semibold">{t(s.title)}</p>
                <p className="mt-1.5 text-[13px] leading-5 text-muted-foreground">{t(s.text)}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
