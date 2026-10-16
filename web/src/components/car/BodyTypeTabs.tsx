import type { BodyType } from "@/lib/api/types";
import { bodyTypeLabel } from "@/lib/constants";
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
  return (
    <div className={cn("no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0", className)}>
      {items.map((b) => {
        const active = b.id === selectedId;
        return (
          <button
            key={b.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? undefined : b.id)}
            className={cn(
              "flex w-[118px] shrink-0 flex-col items-center gap-2 rounded-2xl border-2 bg-card px-3 pb-4 pt-5 text-sm font-semibold transition-colors md:w-[132px]",
              active ? "border-foreground" : "border-transparent hover:border-border"
            )}
          >
            <CarArt shape={shapeFor(b.name)} className="w-14" strokeWidth={2.6} />
            {bodyTypeLabel(b.name)}
          </button>
        );
      })}
    </div>
  );
}
