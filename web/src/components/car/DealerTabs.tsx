"use client";

import DealerAvatar from "@/components/common/DealerAvatar";
import { TileRowSkeleton } from "@/components/common/States";
import { dealerName, type Dealer } from "@/lib/api/dealers";
import { useWheelScrollX } from "@/lib/useWheelScrollX";
import { cn } from "@/lib/utils";

/** Row of dealer logo tiles, styled like `BrandTabs`; picks the dealer filter, tap again to clear. */
export default function DealerTabs({
  items,
  loading,
  selectedId,
  onSelect,
  className,
}: {
  items: Dealer[];
  loading?: boolean;
  selectedId?: number;
  onSelect: (id: number | undefined) => void;
  className?: string;
}) {
  const rowRef = useWheelScrollX<HTMLDivElement>();
  return (
    <div ref={rowRef} className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0", className)}>
      {loading && <TileRowSkeleton />}
      {items.map((d) => {
        const name = dealerName(d);
        const active = d.id === selectedId;
        return (
          <button
            key={d.id}
            type="button"
            aria-pressed={active}
            aria-label={name}
            title={name}
            onClick={() => onSelect(active ? undefined : d.id)}
            className={cn(
              "group flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-card p-2 transition-colors md:size-[72px]",
              active ? "border-foreground" : "border-transparent hover:border-border"
            )}
          >
            <DealerAvatar
              logo={d.logo}
              name={name}
              loading="lazy"
              skeletonClassName="bg-foreground/10 rounded-md"
              imgClassName={cn("h-full w-full object-contain transition", active ? "" : "opacity-80 grayscale group-hover:opacity-100 group-hover:grayscale-0")}
              letterClassName="font-display text-xl font-bold leading-none text-foreground/70"
            />
          </button>
        );
      })}
    </div>
  );
}
