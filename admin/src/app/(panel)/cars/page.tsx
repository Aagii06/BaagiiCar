"use client";

import CarImage from "@/components/car/CarImage";
import { useRejectCar } from "@/components/car/useRejectCar";
import ChipTabs from "@/components/common/ChipTabs";
import { useConfirm, type ConfirmOptions } from "@/components/common/Confirm";
import { inputClass } from "@/components/common/Field";
import { EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import { approveCar, deleteCar, listCars, markSold, setFeatured, setHidden, type CarFilter } from "@/lib/api/admin";
import type { Car } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CAR_STATUS, ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn, formatPrice } from "@/lib/utils";
import { BadgeCheck, Check, Eye, EyeOff, Plus, Search, Star, Trash2, Undo2, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const PAGE_SIZE = 20;
type Tab = NonNullable<CarFilter["status"]> | "all" | "mine";
const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "Бүгд" },
  // Ads the signed-in admin entered themselves, any status but deleted.
  { value: "mine", label: "Миний" },
  { value: "pending", label: "Хүлээгдэж буй" },
  { value: "rejected", label: "Буцаасан" },
  { value: "active", label: "Идэвхтэй" },
  { value: "featured", label: "Онцлох" },
  { value: "hidden", label: "Нуусан" },
  { value: "sold", label: "Зарагдсан" },
  { value: "deleted", label: "Устгасан" },
];

function CarRow({ car, onChanged }: { car: Car; onChanged: () => void }) {
  const toast = useToast();
  const confirm = useConfirm();
  const reject = useRejectCar();
  const isAdmin = useAuth().user?.role === ROLES.admin;
  const [busy, setBusy] = useState(false);
  const st = CAR_STATUS[car.status] ?? CAR_STATUS.active;
  const featured = Boolean(Number(car.is_featured));

  // The ad being changed, shown inside the confirm sheet.
  const detail = (
    <div className="flex items-center gap-3 rounded-2xl bg-muted p-2.5 text-left">
      <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-12 w-16 shrink-0 rounded-lg" artClassName="w-[80%]" />
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{car.name}</p>
        <p className="text-xs font-semibold text-primary">
          {formatPrice(car.price)} <span className="font-medium text-muted-foreground">· #{car.code ?? car.id}</span>
        </p>
      </div>
    </div>
  );

  const run = async (action: () => Promise<void>, done: string, ask?: ConfirmOptions) => {
    if (ask && !(await confirm({ detail, ...ask }))) return;
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
            #{car.code ?? car.id} · {car.dealer_name || car.seller_name || "—"} · {car.phonenumber || car.seller_phone}
          </p>
          {car.status === "rejected" && car.reject_reason && <p className="mt-1 line-clamp-2 text-xs text-destructive">↩ {car.reject_reason}</p>}
        </div>
      </Link>
      {car.status !== "deleted" && (
        <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
          {car.status === "pending" && isAdmin && (
            <button onClick={() => run(() => approveCar(car.id), "Баталлаа, вэб дээр нийтлэгдлээ")} className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white">
              <Check className="size-3.5" strokeWidth={3} />
              Батлах
            </button>
          )}
          {car.status === "pending" && isAdmin && (
            <button
              onClick={async () => {
                setBusy(true);
                if (await reject(car, detail)) onChanged();
                setBusy(false);
              }}
              className="flex items-center gap-1 rounded-lg bg-destructive-soft px-3 py-1.5 text-xs font-bold text-destructive"
            >
              <Undo2 className="size-3.5" />
              Буцаах
            </button>
          )}
          {car.status === "active" && (
            <button
              onClick={() =>
                run(
                  () => setFeatured(car, !featured),
                  featured ? "Онцлохоос хаслаа" : "Онцоллоо",
                  featured
                    ? { title: "Онцлохоос хасах уу?", message: "Нүүр хуудас болон хайлтын эхэнд гарахаа болино.", confirmLabel: "Хасах", tone: "amber", icon: Star }
                    : { title: "Онцлох зар болгох уу?", message: "Нүүр хуудсанд болон хайлтын эхэнд гарна.", confirmLabel: "Онцлох", tone: "amber", icon: Star }
                )
              }
              className={cn("flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold", featured ? "bg-amber" : "bg-muted")}
            >
              <Star className={cn("size-3.5", featured && "fill-current")} />
              Онцлох
            </button>
          )}
          {car.status === "active" && (
            <button onClick={() => run(() => markSold(car.id), "Зарагдсан гэж тэмдэглэлээ", { title: "Зарагдсан гэж тэмдэглэх үү?", message: "Зар вэб дээр «Зарагдсан» тэмдэгтэй харагдана.", confirmLabel: "Тэмдэглэх", icon: BadgeCheck })} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold">
              Зарагдсан
            </button>
          )}
          {car.status === "active" && (
            <button
              onClick={() =>
                run(() => setHidden(car.id, true), "Нууллаа, вэб дээр харагдахгүй", {
                  title: "Зарыг түр нуух уу?",
                  message: "Вэб дээр харагдахаа болино. Дараа нь «Ил гаргах»-аар буцааж нийтэлж болно.",
                  confirmLabel: "Нуух",
                  tone: "amber",
                  icon: EyeOff,
                })
              }
              className="flex items-center gap-1 rounded-lg bg-muted px-3 py-1.5 text-xs font-bold"
            >
              <EyeOff className="size-3.5" />
              Нуух
            </button>
          )}
          {car.status === "hidden" && (
            <button
              onClick={() =>
                run(() => setHidden(car.id, false), "Ил гаргалаа, вэб дээр харагдана", {
                  title: "Зарыг ил гаргах уу?",
                  message: "Вэб дээр дахин харагдана.",
                  confirmLabel: "Ил гаргах",
                  tone: "success",
                  icon: Eye,
                })
              }
              className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white"
            >
              <Eye className="size-3.5" />
              Ил гаргах
            </button>
          )}
          <button onClick={() => run(() => deleteCar(car.id), "Устгалаа", { title: "Зарыг устгах уу?", message: "Устгасан зар вэб дээр харагдахгүй болно.", confirmLabel: "Устгах", tone: "danger", icon: Trash2 })} className="ml-auto rounded-lg bg-destructive-soft px-3 py-1.5 text-xs font-bold text-destructive">
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
  const dealerId = Number(sp.get("dealer")) || undefined;
  const { user } = useAuth();
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
        status: tab === "all" || tab === "mine" ? undefined : tab,
        createdBy: tab === "mine" ? user?.id : undefined,
        dealerId,
        search: q,
        page: 1,
        pageSize: take,
      }),
    `${tab}|${q}|${dealerId ?? ""}|${take}`
  );

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
        {dealerId && (
          <button type="button" onClick={() => setParam({ dealer: "" })} className="flex items-center gap-1.5 rounded-full bg-amber px-3 py-1.5 text-xs font-bold">
            {cars.data?.rows[0]?.dealer_name ?? `Дилер #${dealerId}`}
            <X className="size-3.5" strokeWidth={3} />
          </button>
        )}
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
