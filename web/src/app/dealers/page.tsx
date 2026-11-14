"use client";

import CarCard from "@/components/car/CarCard";
import Container, { PageTitle, SectionTitle, ViewAll } from "@/components/common/Container";
import DealerAvatar from "@/components/common/DealerAvatar";
import PageBanner from "@/components/common/PageBanner";
import Pagination from "@/components/common/Pagination";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { featuredCars } from "@/lib/api/cars";
import { dealerName, getDealer, getDealerCars, getDealers, type Dealer } from "@/lib/api/dealers";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ArrowLeft, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const PAGE_SIZE = 12;
/** Dealers shown at first and added by each "Цааш үзэх". */
const DEALER_STEP = 6;
const FEATURED_COUNT = 6;

function DealerLogo({ dealer, className }: { dealer: Dealer; className?: string }) {
  return (
    <div className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl bg-muted", className)}>
      <DealerAvatar
        logo={dealer.logo}
        name={dealerName(dealer)}
        className="size-full object-contain"
      />
    </div>
  );
}

function DealerPhone({ phone }: { phone: string | null }) {
  if (!phone) return null;
  return (
    <a href={`tel:${phone}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
      <Phone className="size-3.5" />
      {phone}
    </a>
  );
}

function DealerCard({ dealer }: { dealer: Dealer }) {
  const { t } = useI18n();
  return (
    <Link
      href={`/dealers?d=${dealer.id}`}
      className="flex items-center gap-4 rounded-2xl border border-border bg-white p-4 transition hover:border-primary hover:shadow-md"
    >
      <DealerLogo dealer={dealer} className="size-16" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{dealerName(dealer) || t("Дилер")}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">{t("{n} зар", { n: dealer.car_count })}</p>
        {dealer.phonenumber && <p className="mt-1 text-sm text-muted-foreground">{dealer.phonenumber}</p>}
      </div>
    </Link>
  );
}

/** Registered dealers, most listings first, 6 at a time; featured cars below (as on the home page). */
function DealerList() {
  const { t } = useI18n();
  const dealers = useApi(getDealers);
  const featured = useApi(() => featuredCars(FEATURED_COUNT));
  const [shown, setShown] = useState(DEALER_STEP);
  const rows = dealers.data?.rows ?? [];

  return (
    <>
      <PageBanner
        title={t("Дилерүүд")}
        image="showroom"
        imagePosition="object-[center_62%]"
        aside={dealers.loading ? "…" : t("{n} дилер", { n: rows.length })}
        asideLoading={dealers.loading}
      />
      <Container className="pt-4 md:pt-8">
        <div>
          {dealers.loading && !dealers.data ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: DEALER_STEP }, (_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : dealers.error ? (
            <ErrorState message={dealers.error.message} onRetry={dealers.reload} />
          ) : rows.length ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rows.slice(0, shown).map((dealer) => (
                  <DealerCard key={dealer.id} dealer={dealer} />
                ))}
              </div>
              {shown < rows.length && (
                <button
                  type="button"
                  onClick={() => setShown((n) => n + DEALER_STEP)}
                  className="mx-auto mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-card text-sm font-bold hover:bg-border sm:w-64 md:mt-8"
                >
                  {t("Цааш үзэх")}
                  <span className="font-medium text-muted-foreground">
                    {shown} / {rows.length}
                  </span>
                </button>
              )}
            </>
          ) : (
            <EmptyState title={t("Бүртгэлтэй дилер алга")} />
          )}
        </div>
      </Container>

      <Container className="mt-10 md:mt-20">
        <SectionTitle light={t("Онцлох")} bold={t("машинууд")} action={<ViewAll href="/cars" />} />
        <div className="mt-4 md:mt-8">
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
            <EmptyState title={t("Одоогоор зар алга")} />
          )}
        </div>
      </Container>
    </>
  );
}

/** One dealer: profile header and the ads they own or posted. */
function DealerDetail({ id, page }: { id: number; page: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const dealer = useApi(() => getDealer(id), String(id));
  const cars = useApi(() => getDealerCars(id, page, PAGE_SIZE), `${id}:${page}`);
  const totalPages = Math.ceil((cars.data?.count ?? 0) / PAGE_SIZE);

  // Phones use the app bar's back arrow.
  const back = (
    <Link href="/dealers" className="hidden items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground md:inline-flex">
      <ArrowLeft className="size-4" />
      {t("Бүх дилер")}
    </Link>
  );

  if (dealer.error)
    return (
      <Container className="pt-4 md:pt-12">
        {back}
        <ErrorState className="mt-6" message={dealer.error.message} onRetry={dealer.reload} />
      </Container>
    );

  return (
    <>
      <DealerHero dealer={dealer.data} />
      <Container className="mt-6 md:mt-10">
        {cars.loading && !cars.data ? (
          <CardGridSkeleton />
        ) : cars.error ? (
          <ErrorState message={cars.error.message} onRetry={cars.reload} />
        ) : cars.data?.rows.length ? (
          <div className={cn("space-y-8 transition-opacity", cars.loading && "opacity-60")}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cars.data.rows.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
            <Pagination
              page={page}
              total={totalPages}
              onChange={(p) => {
                router.push(`/dealers?d=${id}${p > 1 ? `&page=${p}` : ""}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        ) : (
          <EmptyState title={t("Энэ дилерт одоогоор зар алга")} />
        )}
      </Container>
    </>
  );
}

/** Dealer profile band: dark gradient with soft brand-colour glows, white logo tile, name, count, phone pill. */
function DealerHero({ dealer }: { dealer: Dealer | undefined }) {
  const { t } = useI18n();
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#1b1d24,#23262f_50%,#2e2219)] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-primary opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-96 rounded-full bg-amber opacity-20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>
      <Container className="py-6 md:py-10">
        <Link
          href="/dealers"
          className="hidden items-center gap-1.5 text-sm font-semibold text-white/70 transition-colors hover:text-white md:inline-flex"
        >
          <ArrowLeft className="size-4" />
          {t("Бүх дилер")}
        </Link>
        <div className="flex items-center gap-4 md:mt-6 md:gap-6">
          {dealer ? (
            <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-black/30 md:size-28">
              <DealerAvatar logo={dealer.logo} name={dealerName(dealer)} className="size-full object-contain" />
            </div>
          ) : (
            <div className="size-20 shrink-0 animate-pulse rounded-2xl bg-white/15 md:size-28" />
          )}
          <div className="min-w-0">
            {dealer ? (
              <>
                <h1 className="flex flex-wrap items-center gap-3 font-display text-[26px] font-bold leading-tight md:text-[44px]">
                  {dealerName(dealer) || t("Дилер")}
                  <span className="rounded-lg bg-primary px-2.5 py-1 font-sans text-sm font-bold text-white md:text-base">
                    {t("{n} зар", { n: dealer.car_count })}
                  </span>
                </h1>
                {dealer.address && <p className="mt-1.5 text-sm text-white/70">{dealer.address}</p>}
                {dealer.phonenumber && (
                  <a
                    href={`tel:${dealer.phonenumber}`}
                    className="group mt-3 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 py-1 pl-1 pr-4 text-sm font-semibold backdrop-blur transition-colors hover:bg-white/20"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-white text-primary transition-transform group-hover:scale-105">
                      <Phone className="size-3.5" />
                    </span>
                    {dealer.phonenumber}
                  </a>
                )}
              </>
            ) : (
              <>
                <div className="h-9 w-56 animate-pulse rounded-lg bg-white/15" />
                <div className="mt-3 h-8 w-36 animate-pulse rounded-full bg-white/10" />
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function DealersInner() {
  const sp = useSearchParams();
  const id = Number(sp.get("d"));
  const page = Math.max(Number(sp.get("page")) || 1, 1);
  return Number.isInteger(id) && id > 0 ? <DealerDetail id={id} page={page} /> : <DealerList />;
}

export default function DealersPage() {
  return (
    <Suspense fallback={null}>
      <DealersInner />
    </Suspense>
  );
}
