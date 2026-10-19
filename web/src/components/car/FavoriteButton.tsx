"use client";

import { useFavorites } from "@/lib/favorites/FavoritesProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

export default function FavoriteButton({ carId, className }: { carId: number; className?: string }) {
  const { isFavorite, toggle } = useFavorites();
  const { t } = useI18n();
  const on = isFavorite(carId);
  return (
    <button
      type="button"
      aria-label={on ? t("Хадгалснаас хасах") : t("Хадгалах")}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(carId);
      }}
      className={cn("grid size-9 place-items-center rounded-full bg-white shadow-sm transition hover:scale-105 disabled:opacity-60", className)}
    >
      <Heart className={cn("size-4", on ? "fill-destructive text-destructive" : "text-foreground")} />
    </button>
  );
}
