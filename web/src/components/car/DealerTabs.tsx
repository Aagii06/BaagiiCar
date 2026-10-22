"use client";

import Img from "@/components/common/Img";
import { TileRowSkeleton } from "@/components/common/States";
import { uploadUrl } from "@/lib/api/config";
import { dealerName, type Dealer } from "@/lib/api/dealers";
import { useWheelScrollX } from "@/lib/useWheelScrollX";
import { cn } from "@/lib/utils";
import Link from "next/link";

/** Row of dealer logo tiles, styled like `BrandTabs`; each opens that dealer's page. */
export default function DealerTabs({ items, loading, className }: { items: Dealer[]; loading?: boolean; className?: string }) {
  const rowRef = useWheelScrollX<HTMLDivElement>();
  return (
    <div ref={rowRef} className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0", className)}>
      {loading && <TileRowSkeleton />}
      {items.map((d) => {
        const name = dealerName(d);
        const logo = uploadUrl(d.logo, "full", "dealers");
        return (
          <Link
            key={d.id}
            href={`/dealers?d=${d.id}`}
            aria-label={name}
            title={name}
            className="group flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-transparent bg-card p-2 transition-colors hover:border-border md:size-[72px]"
          >
            {logo ? (
              <Img
                src={logo}
                loading="lazy"
                skeletonClassName="bg-foreground/10 rounded-md"
                className="h-full w-full object-contain opacity-80 grayscale transition group-hover:opacity-100 group-hover:grayscale-0"
              />
            ) : (
              <span className="font-display text-base font-bold leading-none text-foreground/70">{name[0]}</span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
