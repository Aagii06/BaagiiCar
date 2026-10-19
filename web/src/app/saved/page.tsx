"use client";

import CarCard from "@/components/car/CarCard";
import Container, { PageTitle } from "@/components/common/Container";
import RequireAuth from "@/components/common/RequireAuth";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { getFavorites } from "@/lib/api/cars";
import { useFavorites } from "@/lib/favorites/FavoritesProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import Link from "next/link";

function Saved() {
  const { ids, ready } = useFavorites();
  const { t } = useI18n();
  const favorites = useApi(getFavorites);
  // Hide cards un-hearted on this page without refetching.
  const rows = (favorites.data ?? []).filter((c) => !ready || ids.has(c.id));

  return (
    <Container className="pt-8 md:pt-12">
      <PageTitle count={favorites.data ? rows.length : undefined}>{t("Хадгалсан")}</PageTitle>
      <div className="mt-8">
        {favorites.loading && !favorites.data ? (
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

export default function SavedPage() {
  return (
    <RequireAuth>
      <Saved />
    </RequireAuth>
  );
}
