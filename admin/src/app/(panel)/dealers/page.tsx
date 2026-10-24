"use client";

import { DealerAvatar } from "@/components/car/DealerPicker";
import { inputClass } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import PageHeader from "@/components/layout/PageHeader";
import { listDealers } from "@/lib/api/admin";
import { useApi } from "@/lib/useApi";
import { useBackTo, withFrom } from "@/lib/useBackTo";
import { Plus } from "lucide-react";
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
            <Link key={d.id} href={withFrom(`/dealers/${d.id}`, from)} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/60">
              <DealerAvatar dealer={d} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{d.name}</p>
                <p className="truncate text-xs text-muted-foreground">{[d.phonenumber, d.address].filter(Boolean).join(" · ")}</p>
              </div>
              {d.status !== "active" && <span className="text-[10px] font-semibold text-destructive">Идэвхгүй</span>}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
