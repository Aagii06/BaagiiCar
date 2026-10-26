"use client";

import CarCard from "@/components/car/CarCard";
import Container, { PageTitle } from "@/components/common/Container";
import DealerAvatar from "@/components/common/DealerAvatar";
import PageBanner from "@/components/common/PageBanner";
import Pagination from "@/components/common/Pagination";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { dealerName, getDealer, getDealerCars, getDealers, type Dealer } from "@/lib/api/dealers";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ArrowLeft, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const PAGE_SIZE = 12;

function DealerLogo({ dealer, className }: { dealer: Dealer; className?: string }) {
  return (
    <div className={cn("grid shrink-0 place-items-center overflow-hidden rounded-xl bg-muted", className)}>
      <DealerAvatar
        logo={dealer.logo}
        name={dealerName(dealer)}
        imgClassName="size-full object-contain"
        letterClassName="font-display text-2xl font-bold text-foreground/60"
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

/** Registered dealers, most listings first. */
function DealerList() {
  const { t } = useI18n();
  const dealers = useApi(getDealers);
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
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : dealers.error ? (
            <ErrorState message={dealers.error.message} onRetry={dealers.reload} />
          ) : rows.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((dealer) => (
                <DealerCard key={dealer.id} dealer={dealer} />
              ))}
            </div>
          ) : (
            <EmptyState title={t("Бүртгэлтэй дилер алга")} />
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
    <Container className="pt-4 md:pt-12">
      {back}
      <div className="flex items-center gap-4 md:mt-5 md:gap-6">
        {dealer.data ? (
          <DealerLogo dealer={dealer.data} className="size-20 md:size-24" />
        ) : (
          <div className="size-20 animate-pulse rounded-xl bg-muted md:size-24" />
        )}
        <div className="min-w-0">
          {dealer.data ? (
            <>
              <PageTitle count={dealer.data.car_count} className="max-md:flex max-md:text-[28px]">{dealerName(dealer.data) || t("Дилер")}</PageTitle>
              <div className="mt-3">
                <DealerPhone phone={dealer.data.phonenumber} />
              </div>
            </>
          ) : (
            <div className="h-10 w-56 animate-pulse rounded-lg bg-muted" />
          )}
        </div>
      </div>

      <div className="mt-8 md:mt-10">
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
      </div>
    </Container>
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
