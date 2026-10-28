"use client";

import CarRow, { PAGE_SIZE, TABS, type Tab } from "@/components/car/CarRow";
import ChipTabs from "@/components/common/ChipTabs";
import { inputClass, Select } from "@/components/common/Field";
import LoadMore from "@/components/common/LoadMore";
import { EmptyState, ErrorState, LoadingState, Spinner } from "@/components/common/States";
import PageHeader from "@/components/layout/PageHeader";
import { listCars, listDealers, type CarStatusFilter } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthProvider";
import { ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function CarsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  // Several statuses can be on at once (`?status=pending,active`); none = "Бүгд".
  const statuses = (sp.get("status") ?? "").split(",").filter((v): v is CarStatusFilter => v !== "all" && TABS.some((t) => t.value === v));
  const toggleStatus = (v: Tab) => {
    const next = v === "all" ? [] : statuses.includes(v) ? statuses.filter((s) => s !== v) : [...statuses, v];
    setParam({ status: next.join(",") });
  };
  const [search, setSearch] = useState(sp.get("q") ?? "");
  const q = sp.get("q") ?? "";
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.admin;
  // Every non-deleted dealer, so ads of a since-deactivated one can still be filtered.
  const dealers = useApi(() => (isAdmin ? listDealers().then((r) => r.rows) : Promise.resolve([])), String(isAdmin));
  // Admins see every dealer's ads (Бүгд) unless one is picked in the URL.
  const dealerId = isAdmin ? Number(sp.get("dealer")) || undefined : undefined;
  const [take, setTake] = useState(PAGE_SIZE);

  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setTake(PAGE_SIZE);
    router.replace(`${pathname}?${next}`);
  };

  const cars = useApi(
    () =>
      listCars({
        statuses,
        dealerId,
        search: q,
        page: 1,
        pageSize: take,
      }),
    `${statuses.join(",")}|${q}|${dealerId ?? ""}|${take}`
  );

  return (
    <>
      {/* No title: the tab bar says where we are, and "Зар нэмэх" is the + button in the bottom nav. */}
      <PageHeader>
        <div className="flex gap-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setParam({ q: search });
            }}
            className="relative min-w-0 flex-1"
          >
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input className={cn(inputClass, "pl-10")} value={search} onChange={(e) => setSearch(e.target.value)} onBlur={() => search !== q && setParam({ q: search })} placeholder="Нэр, утас эсвэл #дугаар" />
          </form>
          {/* Dealers only ever see their own dealer's ads, so the filter is for admins. */}
          {isAdmin && (
            <span className="w-36 shrink-0">
              {/* Unpicked, the closed field reads "Дилер" as a placeholder; "Бүгд" stays the sheet's first row. */}
              <Select title="Дилер" value={dealerId ? String(dealerId) : ""} valueLabel={dealerId ? undefined : "Дилер"} onChange={(e) => setParam({ dealer: e.target.value })} className={dealerId ? "font-semibold text-foreground" : undefined}>
                <option value="">Бүгд</option>
                {dealers.data?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </span>
          )}
        </div>
        <ChipTabs items={TABS} value={statuses.length ? statuses : ["all"]} onChange={toggleStatus} />
      </PageHeader>

      {cars.loading && !cars.data ? (
        <LoadingState />
      ) : cars.error ? (
        <ErrorState message={cars.error.message} onRetry={cars.reload} />
      ) : !cars.data?.rows.length ? (
        <EmptyState title="Зар олдсонгүй" />
      ) : (
        <>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{cars.data.count} зар</p>
          <div className="space-y-3">
            {cars.data.rows.map((car) => (
              <CarRow key={car.id} car={car} onChanged={cars.reload} showDealer={isAdmin && !dealerId} />
            ))}
          </div>
          {cars.data.rows.length < cars.data.count &&
            // Like the catalog: the next page loads when the list is scrolled to its end. The sentinel is swapped
            // for a spinner while a page loads, so it can't ask twice, and fires again on remount if still in view.
            (cars.loading ? (
              <div role="status" aria-label="Ачаалж байна" className="flex justify-center py-4">
                <Spinner className="size-5" />
              </div>
            ) : (
              <LoadMore key={take} onMore={() => setTake((t) => t + PAGE_SIZE)} />
            ))}
        </>
      )}
    </>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CarsInner />
    </Suspense>
  );
}
