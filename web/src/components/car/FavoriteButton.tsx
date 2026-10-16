"use client";

import { useFavorites } from "@/lib/favorites/FavoritesProvider";
import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";
import { useState } from "react";

export default function FavoriteButton({ carId, className }: { carId: number; className?: string }) {
  const { isFavorite, toggle } = useFavorites();
  const [busy, setBusy] = useState(false);
  const on = isFavorite(carId);
  return (
    <button
      type="button"
      aria-label={on ? "Хадгалснаас хасах" : "Хадгалах"}
      aria-pressed={on}
      disabled={busy}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setBusy(true);
        try {
          await toggle(carId);
        } catch {
          // the heart simply stays as it was
        } finally {
          setBusy(false);
        }
      }}
      className={cn("grid size-9 place-items-center rounded-full bg-white shadow-sm transition hover:scale-105 disabled:opacity-60", className)}
    >
      <Heart className={cn("size-4", on ? "fill-destructive text-destructive" : "text-foreground")} />
    </button>
  );
}
