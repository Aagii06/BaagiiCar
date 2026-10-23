"use client";

import CarImage from "@/components/car/CarImage";
import { useRejectCar } from "@/components/car/useRejectCar";
import ChipTabs, { type ChipTab } from "@/components/common/ChipTabs";
import { useConfirm, type ConfirmOptions } from "@/components/common/Confirm";
import { inputClass, Select } from "@/components/common/Field";
import LoadMore from "@/components/common/LoadMore";
import { EmptyState, ErrorState, LoadingState, Spinner } from "@/components/common/States";
import { errorMessage, useToast } from "@/components/common/Toast";
import PageHeader from "@/components/layout/PageHeader";
import { approveCar, deleteCar, listCars, listDealers, markSold, setFeatured, setHidden, type CarStatusFilter } from "@/lib/api/admin";
import { catalogImage } from "@/lib/api/config";
import type { Car } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { CAR_STATUS, ROLES } from "@/lib/constants";
import { useApi } from "@/lib/useApi";
import { cn, formatPrice } from "@/lib/utils";
import { BadgeCheck, Check, Eye, EyeOff, Search, Star, Store, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

const PAGE_SIZE = 20;
type Tab = CarStatusFilter | "all";
// Each status in its own colour: soft while off, solid once picked.
const TABS: ChipTab<Tab>[] = [
  { value: "all", label: "Бүгд" },
  { value: "pending", label: "Хүлээгдэж буй", tone: { on: "bg-amber text-dark", off: "bg-amber-soft text-amber-ink" } },
  { value: "rejected", label: "Буцаасан", tone: { on: "bg-destructive text-white", off: "bg-destructive-soft text-destructive" } },
  { value: "active", label: "Идэвхтэй", tone: { on: "bg-success text-white", off: "bg-success-soft text-success" } },
  { value: "featured", label: "Онцлох", tone: { on: "bg-primary text-white", off: "bg-primary-soft text-primary" } },
  { value: "hidden", label: "Нуусан", tone: { on: "bg-slate-500 text-white", off: "bg-slate-100 text-slate-600" } },
  { value: "sold", label: "Зарагдсан", tone: { on: "bg-sky-600 text-white", off: "bg-tint-blue text-sky-700" } },
  { value: "deleted", label: "Устгасан", tone: { on: "bg-rose-800 text-white", off: "bg-tint-rose text-rose-800" } },
];

function CarRow({ car, onChanged, showDealer }: { car: Car; onChanged: () => void; showDealer: boolean }) {
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

  const dealerLogo = catalogImage(car.dealer_logo, "dealers");

  return (
    <div className={cn("overflow-hidden rounded-2xl bg-card", busy && "pointer-events-none opacity-60")}>
      {/* Dealer title bar across the card's top, like a status bar, in a muted slate with a soft shadow onto the card.
          Left out when the list is already one dealer's. */}
      {showDealer && (
        <div className="relative z-10 flex items-center gap-2 bg-slate-500 px-3 py-2 text-white shadow-[0_3px_6px_-2px_rgb(0_0_0/0.18)]">
          {dealerLogo ? (
            // eslint-disable-next-line @next/next/no-img-element -- uploaded dealer logo
            <img src={dealerLogo} alt="" className="size-5 shrink-0 rounded-md bg-white object-contain" />
          ) : (
            <Store className="size-4 shrink-0 text-white/70" />
          )}
          <span className={cn("truncate text-xs font-bold", !car.dealer_name && "font-semibold text-white/70")}>{car.dealer_name || "Дилергүй"}</span>
        </div>
      )}
      <div className="p-3">
        <Link href={`/cars/${car.id}`} className="flex gap-3">
          <CarImage id={car.id} image={car.image} bodyType={car.body_type_name} size="thumb" className="h-16 w-20 shrink-0" artClassName="w-[80%]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-bold">{car.name}</p>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold", st.className)}>{st.label}</span>
            </div>
            <p className="text-sm font-semibold text-primary">{formatPrice(car.price)}</p>
            <p className="truncate text-xs text-muted-foreground">
              #{car.code ?? car.id} · {car.phonenumber || car.seller_phone}
            </p>
            {car.status === "rejected" && car.reject_reason && <p className="mt-1 line-clamp-2 text-xs text-destructive">↩ {car.reject_reason}</p>}
          </div>
        </Link>
        {car.status !== "deleted" && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
            {car.status === "pending" && isAdmin && (
              <button onClick={() => run(() => approveCar(car.id), "Баталлаа, вэб дээр нийтлэгдлээ", { title: "Зарыг батлах уу?", message: "Батласны дараа вэб дээр нийтлэгдэнэ.", confirmLabel: "Батлах", tone: "success", icon: Check })} className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white">
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
            {isAdmin && car.status === "active" && (
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
            {isAdmin && car.status === "active" && (
              <button onClick={() => run(() => markSold(car.id), "Зарагдсан гэж тэмдэглэлээ", { title: "Зарагдсан гэж тэмдэглэх үү?", message: "Зар вэб дээр «Зарагдсан» тэмдэгтэй харагдана.", confirmLabel: "Тэмдэглэх", icon: BadgeCheck })} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-bold">
                Зарагдсан
              </button>
            )}
            {car.status === "active" && (
              <button
                onClick={() =>
                  run(() => setHidden(car.id, true), "Нууллаа, вэб дээр харагдахгүй", {
                    title: "Зарыг түр нуух уу?",
                    message: "Вэб дээр харагдахаа болино. Дараа нь «Нийтлэх»-ээр буцааж нийтэлж болно.",
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
                  run(() => setHidden(car.id, false), "Нийтэллээ, вэб дээр харагдана", {
                    title: "Зарыг нийтлэх үү?",
                    message: "Нийтэлсэн зар вэб дээр харагдах боломжтой болно.",
                    confirmLabel: "Нийтлэх",
                    tone: "success",
                    icon: Eye,
                  })
                }
                className="flex items-center gap-1 rounded-lg bg-success px-3 py-1.5 text-xs font-bold text-white"
              >
                <Eye className="size-3.5" />
                Нийтлэх
              </button>
            )}
            {/* Dealers can't delete live or sold ads, only hide / edit them. */}
            {(isAdmin || (car.status !== "active" && car.status !== "sold")) && (
              <button onClick={() => run(() => deleteCar(car.id), "Устгалаа", { title: "Зарыг устгах уу?", message: "Устгасан зар вэб дээр харагдахгүй болно.", confirmLabel: "Устгах", tone: "danger", icon: Trash2 })} className="ml-auto rounded-lg bg-destructive-soft px-3 py-1.5 text-xs font-bold text-destructive">
              Устгах
            </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

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
      {/* No title: the tab bar says where we are, and "Зар нэмэх" sits in the top app bar. */}
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
              <Select title="Дилер" value={dealerId ? String(dealerId) : ""} onChange={(e) => setParam({ dealer: e.target.value })} className={dealerId ? "font-semibold text-foreground" : undefined}>
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
