"use client";

import CarCard from "@/components/car/CarCard";
import Pagination from "@/components/common/Pagination";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { DEALER_CARS_PAGE_SIZE } from "@/components/dealer/constants";
import { getDealerCars } from "@/lib/api/dealers";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

/** The dealer's active ads, paged through the URL (`&page=`). */
export default function DealerCars({ id, page }: { id: number; page: number }) {
  const { t } = useI18n();
  const router = useRouter();
  const cars = useApi(() => getDealerCars(id, page, DEALER_CARS_PAGE_SIZE), `${id}:${page}`);
  const totalPages = Math.ceil((cars.data?.count ?? 0) / DEALER_CARS_PAGE_SIZE);

  if (cars.loading && !cars.data) return <CardGridSkeleton />;
  if (cars.error) return <ErrorState message={cars.error.message} onRetry={cars.reload} />;
  if (!cars.data?.rows.length) return <EmptyState title={t("Энэ дилерт одоогоор зар алга")} />;

  return (
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
  );
}
