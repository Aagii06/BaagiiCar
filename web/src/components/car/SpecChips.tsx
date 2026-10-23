"use client";

import type { Car } from "@/lib/api/types";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn, formatNumber } from "@/lib/utils";

/** Mileage strip on every card: label on the left, the km figure on the right. */
export default function SpecChips({ car, className }: { car: Car; className?: string }) {
  const { t } = useI18n();
  return (
    <div className={cn("flex items-baseline justify-between gap-3 rounded-xl bg-muted px-3.5 py-2.5", className)}>
      <span className="text-xs font-medium text-muted-foreground">{t("Гүйлт")}</span>
      {car.mileage != null ? (
        <span className="font-display text-[15px] font-semibold tabular-nums">
          {formatNumber(car.mileage)}
          <span className="ml-1 text-xs font-medium text-muted-foreground">{t("км")}</span>
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      )}
    </div>
  );
}
