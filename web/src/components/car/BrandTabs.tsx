"use client";

import { catalogImage } from "@/lib/api/config";
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
              "group grid h-12 w-[72px] shrink-0 place-items-center rounded-xl border-2 bg-card px-2 transition-colors md:w-20",
              active ? "border-foreground" : "border-transparent hover:border-border"
            )}
          >
            {/* Logo only — the name is in the label / tooltip. */}
            <span className="grid aspect-[12/5] w-9 place-items-center">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element -- seeded remote logos
                <img
                  src={logo}
                  alt=""
                  loading="lazy"
                  className={cn("max-h-full max-w-full object-contain transition", active ? "" : "opacity-80 grayscale group-hover:opacity-100 group-hover:grayscale-0")}
                />
              ) : (
                <span className="font-display text-base font-bold leading-none text-foreground/70">{b.name[0]}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
