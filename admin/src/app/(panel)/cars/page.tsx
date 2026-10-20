"use client";

import CarImage from "@/components/car/CarImage";
import ChipTabs from "@/components/common/ChipTabs";
import { inputClass } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import { approveCar, deleteCar, listCars, markSold, setFeatured, type CarFilter } from "@/lib/api/admin";
import type { Car } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CAR_STATUS, ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn, formatPrice } from "@/lib/utils";
import { Check, Plus, Search, Star } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const PAGE_SIZE = 20;
type Tab = NonNullable<CarFilter["status"]> | "all";
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Бүгд" },
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "active", label: "Идэвхтэй" },
  { value: "featured", label: "Онцлох" },
  { value: "sold", label: "Зарагдсан" },
  { value: "deleted", label: "Устгасан" },
];

function CarRow({ car, onChanged }: { car: Car; onChanged: () => void }) {
  const toast = useToast();
  const isAdmin = useAuth().user?.role === ROLES.admin;
  const [busy, setBusy] = useState(false);
  const st = CAR_STATUS[car.status] ?? CAR_STATUS.active;
  const featured = Boolean(Number(car.is_featured));

  const run = async (action: () => Promise<void>, done: string, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    try {
      await action();
      toast(done);
      onChanged();
    } catch (err) {
      toast(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("rounded-2xl bg-card p-3", busy && "pointer-events-none opacity-60")}>
      <Link href={`/cars/${car.id}`} className="flex gap-3">
        <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-16 w-20 shrink-0" artClassName="w-[80%]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-bold">{car.name}</p>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", st.className)}>{st.label}</span>
          </div>
          <p className="text-sm font-semibold text-primary">{formatPrice(car.price)}</p>
          <p className="truncate text-xs text-muted-foreground">
            #{car.id} · {car.seller_name || "—"} · {car.phonenumber || car.seller_phone}
          </p>
        </div>
      </Link>
      {car.status !== "deleted" && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          {car.status === "pending" && isAdmin && (
            <button onClick={() => run(() => approveCar(car.id), "Баталлаа, вэб дээр нийтлэгдлээ")} className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white">
              <Check className="size-3.5" strokeWidth={3} />
              Батлах
            </button>
          )}
          {car.status === "active" && (
            <button
              onClick={() => run(() => setFeatured(car, !featured), featured ? "Онцлохоос хаслаа" : "Онцоллоо")}
              className={cn("flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold", featured ? "bg-amber" : "bg-muted")}
            >
              <Star className={cn("size-3.5", featured && "fill-current")} />
              Онцлох
            </button>
          )}
          {car.status === "active" && (
            <button onClick={() => run(() => markSold(car.id), "Зарагдсан гэж тэмдэглэлээ", "Зарагдсан гэж тэмдэглэх үү?")} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold">
              Зарагдсан
            </button>
          )}
          <button onClick={() => run(() => deleteCar(car.id), "Устгалаа", `#${car.id} зарыг устгах уу?`)} className="ml-auto rounded-lg bg-destructive-soft px-3 py-1.5 text-xs font-bold text-destructive">
            Устгах
          </button>
        </div>
      )}
    </div>
  );
}

function CarsInner() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const tab = (TABS.find((t) => t.value === sp.get("status"))?.value ?? "all") as Tab;
  const [search, setSearch] = useState(sp.get("q") ?? "");
  const q = sp.get("q") ?? "";
  const [take, setTake] = useState(PAGE_SIZE);

  const setParam = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    setTake(PAGE_SIZE);
    router.replace(`${pathname}?${next}`);
  };

  const cars = useApi(() => listCars({ status: tab === "all" ? undefined : tab, search: q, page: 1, pageSize: take }), `${tab}|${q}|${take}`);

  return (
    <>
      <PageHeader
        title="Зарууд"
        aside={
          <Link href="/cars/new" className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-bold text-white">
            <Plus className="size-4" strokeWidth={2.6} />
            Нэмэх
          </Link>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam({ q: search });
          }}
          className="relative"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className={cn(inputClass, "pl-10")} value={search} onChange={(e) => setSearch(e.target.value)} onBlur={() => search !== q && setParam({ q: search })} placeholder="Нэр, утас эсвэл #дугаар" />
        </form>
        <ChipTabs items={TABS} value={tab} onChange={(v) => setParam({ status: v === "all" ? "" : v })} />
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
          <div className="space-y-2">
            {cars.data.rows.map((car) => (
              <CarRow key={car.id} car={car} onChanged={cars.reload} />
            ))}
          </div>
          {cars.data.rows.length < cars.data.count && (
            <button onClick={() => setTake((t) => t + PAGE_SIZE)} disabled={cars.loading} className="mt-4 w-full rounded-xl bg-card py-3 text-sm font-bold disabled:opacity-60">
              {cars.loading ? "Ачаалж байна…" : "Цааш үзэх"}
            </button>
          )}
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
