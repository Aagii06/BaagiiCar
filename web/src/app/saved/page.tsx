"use client";

import CarCard from "@/components/car/CarCard";
import Container, { PageTitle } from "@/components/common/Container";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { getCarsByIds } from "@/lib/api/cars";
import { useFavorites } from "@/lib/favorites/FavoritesProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import Link from "next/link";
import { useState } from "react";

export default function SavedPage() {
  const { ids, ready } = useFavorites();
  const { t } = useI18n();
  // Fetch the list as it was on arrival; un-hearted cards just hide, no refetch.
  const [loadedIds, setLoadedIds] = useState<number[] | null>(null);
  if (ready && loadedIds === null) setLoadedIds([...ids]);
  const favorites = useApi(() => (loadedIds ? getCarsByIds(loadedIds) : Promise.resolve(undefined)), loadedIds?.join(",") ?? "");
  const rows = (favorites.data ?? []).filter((c) => ids.has(c.id));
  const loading = !loadedIds || (favorites.loading && !favorites.data);

  return (
    <Container className="pt-8 md:pt-12">
      <PageTitle count={loading ? undefined : rows.length}>{t("Хадгалсан")}</PageTitle>
      <div className="mt-8">
        {loading ? (
          <CardGridSkeleton count={3} />
        ) : favorites.error ? (
          <ErrorState message={favorites.error.message} onRetry={favorites.reload} />
        ) : rows.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {rows.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={t("Хадгалсан зар алга")}
            description={t("Таалагдсан машиныхаа ♡ дээр дарж хадгална уу.")}
            action={<Link href="/cars" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white">{t("Машин хайх")}</Link>}
          />
        )}
      </div>
    </Container>
  );
}
