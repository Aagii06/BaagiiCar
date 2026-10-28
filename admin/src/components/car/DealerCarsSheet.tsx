"use client";

import CarRow, { PAGE_SIZE, TABS, type Tab } from "@/components/car/CarRow";
import { DealerAvatar } from "@/components/car/DealerPicker";
import ChipTabs from "@/components/common/ChipTabs";
import LoadMore from "@/components/common/LoadMore";
import { CarRowsSkeleton, EmptyState, ErrorState, Spinner } from "@/components/common/States";
import { listCars, type CarStatusFilter } from "@/lib/api/admin";
import type { Dealer } from "@/lib/api/types";
import { useApi } from "@/lib/useApi";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

/** One dealer's ads over the whole phone column, so the dealer list stays where it was underneath. */
export default function DealerCarsSheet({ dealer, onClose }: { dealer: Dealer; onClose: () => void }) {
  const [statuses, setStatuses] = useState<CarStatusFilter[]>([]);
  const [take, setTake] = useState(PAGE_SIZE);
  const toggleStatus = (v: Tab) => {
    setStatuses(v === "all" ? [] : statuses.includes(v) ? statuses.filter((s) => s !== v) : [...statuses, v]);
    setTake(PAGE_SIZE);
  };
  const cars = useApi(() => listCars({ statuses, dealerId: dealer.id, page: 1, pageSize: take }), `${dealer.id}|${statuses.join(",")}|${take}`);

  // Esc goes back (unless it's closing a confirm on top); the page behind doesn't scroll while the sheet is up.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector('[role="alertdialog"]') && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    // z-40: over the panel's bars (z-30), under toasts (z-40, later in the DOM) and confirms (z-50).
    <div className="fixed inset-0 z-40 bg-dark/40">
      <div role="dialog" aria-modal="true" aria-labelledby="dealer-cars-title" className="mx-auto flex h-full max-w-md animate-fade-in flex-col bg-background shadow-2xl">
        <header className="space-y-3 border-b border-border bg-white px-2 pb-3 pt-2">
          <div className="flex items-center gap-2">
            <button type="button" onClick={onClose} aria-label="Буцах" className="grid size-10 shrink-0 place-items-center rounded-xl hover:bg-muted">
              <ChevronLeft className="size-5" />
            </button>
            <DealerAvatar dealer={dealer} className="size-8" />
            <div className="min-w-0 flex-1">
              <h2 id="dealer-cars-title" className="truncate text-base font-bold">
                {dealer.name}
              </h2>
              {cars.data && <p className="text-xs font-semibold text-muted-foreground">{cars.data.count} зар</p>}
            </div>
          </div>
          <div className="px-2">
            <ChipTabs items={TABS} value={statuses.length ? statuses : ["all"]} onChange={toggleStatus} />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {cars.loading && !cars.data ? (
            <CarRowsSkeleton />
          ) : cars.error ? (
            <ErrorState message={cars.error.message} onRetry={cars.reload} />
          ) : !cars.data?.rows.length ? (
            <EmptyState title="Зар олдсонгүй" />
          ) : (
            <>
              <div className="space-y-3">
                {cars.data.rows.map((car) => (
                  <CarRow key={car.id} car={car} onChanged={cars.reload} showDealer={false} />
                ))}
              </div>
              {cars.data.rows.length < cars.data.count &&
                (cars.loading ? (
                  <div role="status" aria-label="Ачаалж байна" className="flex justify-center py-4">
                    <Spinner className="size-5" />
                  </div>
                ) : (
                  <LoadMore key={take} onMore={() => setTake((t) => t + PAGE_SIZE)} />
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
