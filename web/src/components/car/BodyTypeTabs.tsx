"use client";

import Img from "@/components/common/Img";
import { catalogImage } from "@/lib/api/config";
import type { BodyType } from "@/lib/api/types";
import { bodyTypeLabel } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useWheelScrollX } from "@/lib/useWheelScrollX";
import { cn } from "@/lib/utils";

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
  const rowRef = useWheelScrollX<HTMLDivElement>();
  return (
    // One scrolling row at every width, like the brands above it.
    <div ref={rowRef} className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0", className)}>
      {items.map((b) => {
        const active = b.id === selectedId;
        const image = catalogImage(b.image, "bodyTypes");
        return (
          <button
            key={b.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? undefined : b.id)}
            className={cn(
              "flex w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl border-2 bg-card px-1.5 pb-2 pt-2.5 text-xs font-semibold transition-colors md:w-[84px]",
              active ? "border-foreground" : "border-transparent hover:border-border"
            )}
          >
            <Img src={image} className="h-7 w-11 rounded-md object-contain" loading="lazy" />
            {bodyTypeLabel(b.name, t)}
          </button>
        );
      })}
    </div>
  );
}
