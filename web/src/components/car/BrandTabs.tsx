"use client";

import Img from "@/components/common/Img";
import { catalogImage } from "@/lib/api/config";
import type { Brand } from "@/lib/api/types";
import { useWheelScrollX } from "@/lib/useWheelScrollX";
import { cn } from "@/lib/utils";

/** Row of brand tiles above the body types; one at a time, tap again to clear. */
export default function BrandTabs({
  items,
  selectedId,
  onSelect,
  className,
}: {
  items: Brand[];
  selectedId?: number;
  onSelect: (id: number | undefined) => void;
  className?: string;
}) {
  const rowRef = useWheelScrollX<HTMLDivElement>();
  return (
    // One scrolling row at every width — there are too many brands to wrap.
    <div ref={rowRef} className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0", className)}>
      {items.map((b) => {
        const active = b.id === selectedId;
        const logo = catalogImage(b.logo, "brands");
        return (
          <button
            key={b.id}
            type="button"
            aria-pressed={active}
            aria-label={b.name}
            title={b.name}
            onClick={() => onSelect(active ? undefined : b.id)}
            className={cn(
              "group flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-card p-2 transition-colors md:size-[72px]",
              active ? "border-foreground" : "border-transparent hover:border-border"
            )}
          >
            {/* Square tile, logo only (name is in the label / tooltip). Flex, not grid: a grid's
                auto row grows to the image's natural height, so h-full would not contain it. */}
            {logo ? (
              <Img
                src={logo}
                loading="lazy"
                skeletonClassName="bg-foreground/10 rounded-md"
                className={cn("h-full w-full object-contain transition", active ? "" : "opacity-80 grayscale group-hover:opacity-100 group-hover:grayscale-0")}
              />
            ) : (
              <span className="font-display text-base font-bold leading-none text-foreground/70">{b.name[0]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
