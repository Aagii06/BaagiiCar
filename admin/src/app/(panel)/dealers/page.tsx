"use client";

import DealerCarsSheet from "@/components/car/DealerCarsSheet";
import { DealerAvatar } from "@/components/car/DealerPicker";
import { inputClass } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import PageHeader from "@/components/layout/PageHeader";
import { listDealers } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { useBackTo, withFrom } from "@/lib/useBackTo";
import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";

/** Dealer registry: showrooms that ads and admin / dealer users belong to. */
export default function DealersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DealersList />
    </Suspense>
  );
}

function DealersList() {
  // Opened from home (`?from=home`) → back returns there, else to Профайл.
  const { from, back } = useBackTo("/profile");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const dealers = useApi(() => listDealers(q), q);
  // Dealer whose ads are open in the full-screen sheet.
  const [carsOf, setCarsOf] = useState<Dealer | null>(null);

  return (
    <>
      <PageHeader
        title="Дилерүүд"
        back={back}
        aside={
          <Link href={withFrom("/dealers/new", from)} className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white">
            <Plus className="size-4" strokeWidth={2.6} />
            Бүртгэх
          </Link>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQ(search);
          }}
        >
          <input className={inputClass} value={search} onChange={(e) => setSearch(e.target.value)} onBlur={() => setQ(search)} placeholder="Дилерийн нэр эсвэл утас" />
        </form>
      </PageHeader>

      {dealers.loading && !dealers.data ? (
        <LoadingState />
      ) : dealers.error ? (
        <ErrorState message={dealers.error.message} onRetry={dealers.reload} />
      ) : !dealers.data?.rows.length ? (
        <EmptyState title={q ? "Дилер олдсонгүй" : "Бүртгэлтэй дилер алга"} />
      ) : (
        // Edge to edge, right under the header (cancels main's px-4 and the header's mb-4).
        <div className="-mx-4 -mt-4 divide-y divide-border border-b border-border bg-white">
          {dealers.data.rows.map((d) => (
            // The row opens the dealer; the right button (outside the link) its ads in a sheet.
            <div key={d.id} className="flex items-center hover:bg-muted/60">
              <Link href={withFrom(`/dealers/${d.id}`, from)} className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4">
                <DealerAvatar dealer={d} className="size-10" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{[d.phonenumber, d.address].filter(Boolean).join(" · ")}</p>
                </div>
                {d.status !== "active" && <span className="text-[10px] font-semibold text-destructive">Идэвхгүй</span>}
              </Link>
              <button type="button" onClick={() => setCarsOf(d)} className="mx-3 flex shrink-0 items-center gap-0.5 rounded-lg bg-muted px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-border">
                Зарууд
                {d.car_count != null && <span className="ml-0.5 rounded-full bg-primary px-1.5 text-[10px] leading-4 text-white">{d.car_count}</span>}
                <ChevronRight className="size-3.5" strokeWidth={2.6} />
              </button>
            </div>
          ))}
        </div>
      )}

      {carsOf && (
        <DealerCarsSheet
          dealer={carsOf}
          onClose={() => {
            setCarsOf(null);
            // Ads may have been deleted in the sheet, so refresh the counts.
            dealers.reload();
          }}
        />
      )}
    </>
  );
}
