"use client";

import { catalogImage } from "@/lib/api/config";
import type { BodyType } from "@/lib/api/types";
import { bodyTypeLabel } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import CarArt, { shapeFor } from "./CarArt";

/**
 * Row of body-type tiles; selected ones get the heavy black outline.
 * Single-select via `selectedId`/`onSelect`, or multi via `selectedIds`/`onToggle`.
 */
export default function BodyTypeTabs({
  items,
  selectedId,
  selectedIds,
  onSelect,
  onToggle,
  className,
}: {
  items: BodyType[];
  selectedId?: number;
  selectedIds?: number[];
  onSelect?: (id: number | undefined) => void;
  onToggle?: (id: number) => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <div className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0", className)}>
      {items.map((b) => {
        const active = selectedIds ? selectedIds.includes(b.id) : b.id === selectedId;
        const image = catalogImage(b.image, "bodyTypes");
        return (
          <button
            key={b.id}
            type="button"
            aria-pressed={active}
            onClick={() => (onToggle ? onToggle(b.id) : onSelect?.(active ? undefined : b.id))}
            className={cn(
              "flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl border-2 bg-card px-1.5 pb-2 pt-2.5 text-xs font-semibold transition-colors md:w-[84px]",
              active ? "border-foreground" : "border-transparent hover:border-border"
            )}
          >
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-7 w-11 object-contain" loading="lazy" />
            ) : (
              <CarArt shape={shapeFor(b.name)} className="w-9" strokeWidth={2.6} />
            )}
            {bodyTypeLabel(b.name, t)}
          </button>
        );
      })}
    </div>
  );
}
