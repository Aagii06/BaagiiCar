"use client";

import Img from "@/components/common/Img";
import { inputClass } from "@/components/common/Field";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/common/States";
import { catalogImage } from "@/lib/api/config";
import type { Dealer } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useApi } from "@/lib/useApi";
import { initials } from "@/lib/utils";
import { getDealers } from "@/lib/api/cars";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

export function DealerAvatar({ dealer, className = "size-11" }: { dealer: Pick<Dealer, "name" | "logo">; className?: string }) {
  const logo = catalogImage(dealer.logo, "dealers");
  return (
    <Img
      src={logo}
      className={`${className} shrink-0 rounded-xl border border-border bg-white object-contain p-1`}
      fallback={<span className={`${className} grid shrink-0 place-items-center rounded-xl bg-amber text-sm font-bold`}>{initials(dealer.name)}</span>}
    />
  );
}

/** First step of `/cars/new` for admins: every ad belongs to a dealer. */
export default function DealerPicker({ onPick }: { onPick: (dealer: Dealer) => void }) {
  const dealers = useApi(getDealers);
  const { user } = useAuth();
  // The signed-in user's own dealer (Профайл засах), offered first.
  const mine = dealers.data?.find((d) => d.id === user?.dealer_id);
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const rows = (dealers.data ?? []).filter((d) => !needle || d.name.toLowerCase().includes(needle) || (d.phonenumber ?? "").includes(needle));

  return (
    <div className="space-y-4">
      {mine && (
        <button type="button" onClick={() => onPick(mine)} className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left ring-2 ring-primary hover:bg-muted/60">
          <DealerAvatar dealer={mine} />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-bold">{mine.name}</span>
            <span className="block text-xs text-muted-foreground">Миний дилер</span>
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </button>
      )}

      <section className="space-y-3 rounded-2xl bg-card p-4">
        <h2 className="text-lg font-bold">Дилер сонгох</h2>
        <input className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Дилерийн нэр эсвэл утас" />
        {dealers.loading && !dealers.data ? (
          <ListSkeleton count={5} avatar="square" className="-mx-1 divide-y divide-border" rowClassName="px-1 py-2.5" />
        ) : dealers.error ? (
          <ErrorState message={dealers.error.message} onRetry={dealers.reload} />
        ) : !rows.length ? (
          <EmptyState title={dealers.data?.length ? "Дилер олдсонгүй" : "Идэвхтэй дилер алга"} />
        ) : (
          <div className="-mx-1 divide-y divide-border">
            {rows.map((d) => (
              <button key={d.id} type="button" onClick={() => onPick(d)} className="flex w-full items-center gap-3 rounded-xl px-1 py-2.5 text-left hover:bg-muted/60">
                <DealerAvatar dealer={d} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">{d.name}</span>
                  <span className="block text-xs text-muted-foreground">{d.phonenumber}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
