"use client";

import { remoteImage } from "@/lib/api/config";
import type { Brand } from "@/lib/api/types";
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
  return (
    // One scrolling row at every width — there are too many brands to wrap.
    <div className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0", className)}>
      {items.map((b) => {
        const active = b.id === selectedId;
        const logo = remoteImage(b.logo);
        return (
          <button
            key={b.id}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(active ? undefined : b.id)}
            className={cn(
              "group flex w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-xl border-2 bg-card px-2 pb-2.5 pt-3 text-[13px] font-semibold transition-colors md:w-[100px]",
              active ? "border-foreground" : "border-transparent hover:border-border"
            )}
          >
            {/* Same box as the body types' car art (w-11, 120×50), so both rows match. */}
            <span className="grid aspect-[12/5] w-11 place-items-center">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- seeded remote logos
                <img
                  src={logo}
                  alt=""
                  loading="lazy"
                  className={cn("max-h-full max-w-full object-contain transition", active ? "" : "opacity-80 grayscale group-hover:opacity-100 group-hover:grayscale-0")}
                />
              ) : (
                <span className="font-display text-lg font-bold leading-none text-foreground/70">{b.name[0]}</span>
              )}
            </span>
            <span className="w-full truncate text-center">{b.name}</span>
          </button>
        );
      })}
    </div>
  );
}
