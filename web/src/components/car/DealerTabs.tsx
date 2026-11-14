"use client";

import DealerAvatar from "@/components/common/DealerAvatar";
import { TileRowSkeleton } from "@/components/common/States";
import { dealerName, type Dealer } from "@/lib/api/dealers";
import { useWheelScrollX } from "@/lib/useWheelScrollX";
import { cn } from "@/lib/utils";
import Link from "next/link";

/** Row of dealer logo tiles, styled like `BrandTabs`; each opens that dealer's page. The filtered dealer is outlined. */
export default function DealerTabs({
  items,
  loading,
  selectedId,
  className,
}: {
  items: Dealer[];
  loading?: boolean;
  selectedId?: number;
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
          <Link
            key={d.id}
            href={`/dealers?d=${d.id}`}
            aria-current={active ? "true" : undefined}
            aria-label={name}
            title={name}
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
              className="h-full w-full object-contain"
            />
          </Link>
        );
      })}
    </div>
  );
}
