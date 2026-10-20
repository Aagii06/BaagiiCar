"use client";

import type { BodyType } from "@/lib/api/types";
import { bodyTypeLabel } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import CarArt, { shapeFor } from "./CarArt";

/** Row of body-type tiles; the selected one gets the heavy black outline. */
export default function BodyTypeTabs({
  items,
  selectedId,
  onSelect,
  className,
}: {
  items: BodyType[];
  selectedId?: number;
  onSelect: (id: number | undefined) => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0", className)}>
      {items.map((b) => {
        const active = b.id === selectedId;
        return (
          <button
            key={b.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? undefined : b.id)}
            className={cn(
              "flex w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-xl border-2 bg-card px-2 pb-2.5 pt-3 text-[13px] font-semibold transition-colors md:w-[100px]",
              active ? "border-foreground" : "border-transparent hover:border-border"
            )}
          >
            <CarArt shape={shapeFor(b.name)} className="w-11" strokeWidth={2.6} />
            {bodyTypeLabel(b.name, t)}
          </button>
        );
      })}
    </div>
  );
}
