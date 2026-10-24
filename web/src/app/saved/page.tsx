"use client";

import CarCard from "@/components/car/CarCard";
import Container, { PageTitle } from "@/components/common/Container";
import ProfileSidebar from "@/components/layout/ProfileSidebar";
import { CardGridSkeleton, EmptyState, ErrorState } from "@/components/common/States";
import { getCarsByIds } from "@/lib/api/cars";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useFavorites } from "@/lib/favorites/FavoritesProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export default function SavedPage() {
  const { ids, ready } = useFavorites();
  const { t } = useI18n();
  const { user } = useAuth();
  // Fetch the list as it was on arrival; un-hearted cards just hide, no refetch.
  const [loadedIds, setLoadedIds] = useState<number[] | null>(null);
  if (ready && loadedIds === null) setLoadedIds([...ids]);
  const favorites = useApi(() => (loadedIds ? getCarsByIds(loadedIds) : Promise.resolve(undefined)), loadedIds?.join(",") ?? "");
  const rows = (favorites.data ?? []).filter((c) => ids.has(c.id));
  const loading = !loadedIds || (favorites.loading && !favorites.data);

  return (
    <Container className="pt-4 md:pt-12">
      <PageTitle count={loading ? undefined : rows.length}>{t("Хадгалсан")}</PageTitle>
      {/* Signed in, desktop: the account menu on the left (favorites also work signed out). */}
      <div className={cn("mt-0 md:mt-8", user && "lg:grid lg:grid-cols-[300px_1fr] lg:items-start lg:gap-5")}>
        <ProfileSidebar className="hidden lg:block" />
        <div className="min-w-0">
          {loading ? (
            <CardGridSkeleton count={3} />
          ) : favorites.error ? (
            <ErrorState message={favorites.error.message} onRetry={favorites.reload} />
          ) : rows.length ? (
            <div className={cn("grid gap-4 sm:grid-cols-2", user ? "xl:grid-cols-3" : "lg:grid-cols-3 xl:grid-cols-4")}>
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
      </div>
    </Container>
  );
}
