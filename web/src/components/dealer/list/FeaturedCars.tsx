"use client";

import CarCard from "@/components/car/CarCard";
import Container, { SectionTitle, ViewAll } from "@/components/common/Container";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { FEATURED_COUNT } from "@/components/dealer/constants";
import { featuredCars } from "@/lib/api/cars";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";

/** "Онцлох машинууд" section under the dealer list (as on the home page). */
export default function FeaturedCars() {
  const { t } = useI18n();
  const featured = useApi(() => featuredCars(FEATURED_COUNT));

  return (
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
  );
}
