"use client";

import BrandTabs from "@/components/car/BrandTabs";
import CarArt, { shapeFor } from "@/components/car/CarArt";
import CarCard from "@/components/car/CarCard";
import CarWideCard from "@/components/car/CarWideCard";
import DealerTabs from "@/components/car/DealerTabs";
import Container from "@/components/common/Container";
import { Select } from "@/components/common/Field";
import Pagination from "@/components/common/Pagination";
import { CardGridSkeleton, EmptyState, ErrorState, LoadingState, Spinner } from "@/components/common/States";
import Img from "@/components/common/Img";
import { CAR_SORTS, getBodyTypes, getBrands, getModels, searchCars, type CarSort } from "@/lib/api/cars";
import { catalogImage } from "@/lib/api/config";
import { getDealers } from "@/lib/api/dealers";
import type { BodyType, Brand, CarModel } from "@/lib/api/types";
import { bodyTypeLabel, FUEL_TYPES, PAGE_SIZE, STEERINGS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const MLN = 1_000_000;

type Params = {
  brand?: number;
  model?: number;
  body: number[];
  location?: number;
  yearFrom?: number;
  yearTo?: number;
  importFrom?: number;
  importTo?: number;
  priceMin?: number; // сая ₮
  priceMax?: number;
  fuel: string[];
  steering?: string;
  sort: CarSort;
  page: number;
};

const num = (v: string | null) => (v && Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : undefined);
const list = (v: string | null) => (v ? v.split(",").filter(Boolean) : []);

function readParams(sp: URLSearchParams): Params {
  const sort = sp.get("sort");
  return {
    // Older links may carry several brands; only one is used now.
    brand: num(list(sp.get("brand"))[0] ?? null),
    model: num(sp.get("model")),
    body: list(sp.get("body")).map(Number).filter((n) => Number.isInteger(n) && n > 0),
    location: num(sp.get("location")),
    yearFrom: num(sp.get("yearFrom")),
    yearTo: num(sp.get("yearTo")),
    importFrom: num(sp.get("importFrom")),
    importTo: num(sp.get("importTo")),
    priceMin: num(sp.get("priceMin")),
    priceMax: num(sp.get("priceMax")),
    fuel: list(sp.get("fuel")),
    steering: sp.get("steering") || undefined,
    sort: CAR_SORTS.find((o) => o.value === sort)?.value ?? "new",
    page: num(sp.get("page")) ?? 1,
  };
}

function writeParams(p: Params) {
  const q = new URLSearchParams();
  if (p.brand) q.set("brand", String(p.brand));
  if (p.model) q.set("model", String(p.model));
  if (p.body.length) q.set("body", p.body.join(","));
  if (p.location) q.set("location", String(p.location));
  if (p.yearFrom) q.set("yearFrom", String(p.yearFrom));
  if (p.yearTo) q.set("yearTo", String(p.yearTo));
  if (p.importFrom) q.set("importFrom", String(p.importFrom));
  if (p.importTo) q.set("importTo", String(p.importTo));
  if (p.priceMin) q.set("priceMin", String(p.priceMin));
  if (p.priceMax) q.set("priceMax", String(p.priceMax));
  if (p.fuel.length) q.set("fuel", p.fuel.join(","));
  if (p.steering) q.set("steering", p.steering);
  if (p.sort !== "new") q.set("sort", p.sort);
  if (p.page > 1) q.set("page", String(p.page));
  return q.toString();
}

/** One titled block inside the filter card; blocks after the first get a divider. */
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-[13px] font-bold">{title}</h3>
      {children}
    </div>
  );
}

const THIS_YEAR = new Date().getFullYear();
const FIRST_YEAR = 1950;
// Newest first: recent years are the ones people pick.
const YEARS = Array.from({ length: THIS_YEAR - FIRST_YEAR + 1 }, (_, i) => THIS_YEAR - i);
// Million ₮ steps, as on unegui.mn's car listings.
const PRICES = [5, 10, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90, 100, 200, 300];

/**
 * From / to dropdowns over a fixed list of steps (in display order); each side only
 * offers values that keep from ≤ to. A value from an older link that is not a step
 * is still listed, so the select can show it.
 */
function RangeSelect({
  options,
  from,
  to,
  onChange,
}: {
  options: number[];
  from?: number;
  to?: number;
  onChange: (from: number | undefined, to: number | undefined) => void;
}) {
  const { t } = useI18n();
  const descending = options[0] > options[options.length - 1];
  const all = [...new Set([...options, ...[from, to].filter((v): v is number => !!v)])].sort((a, b) => (descending ? b - a : a - b));
  const side = (label: string, value: number | undefined, keep: (v: number) => boolean, pick: (v: number | undefined) => void) => (
    <Select value={value ?? ""} onChange={(e) => pick(num(e.target.value))} aria-label={label} className="h-11 px-3 text-sm">
      <option value="">{label}</option>
      {all.filter(keep).map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </Select>
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      {side(t("Доод"), from, (v) => !to || v <= to, (v) => onChange(v, to))}
      {side(t("Дээд"), to, (v) => !from || v >= from, (v) => onChange(from, v))}
    </div>
  );
}

/** Covers a disabled Select's chevron while its options load. */
function SelectSpinner() {
  return <Spinner className="pointer-events-none absolute right-3 top-1/2 size-5 -translate-y-1/2 rounded-full bg-muted" />;
}

type Loaded<T> = { data: T | undefined; loading: boolean };

// Brands and models come from the page: `Filters` remounts on every filter
// change, and fetching here would reload them each time.
function Filters({
  p,
  set,
  brands,
  models,
  bodyTypes,
}: {
  p: Params;
  set: (patch: Partial<Params>) => void;
  brands: Loaded<Brand[]>;
  models: Loaded<CarModel[]>;
  bodyTypes: BodyType[];
}) {
  const { t, tv } = useI18n();
  // Brand picked but the URL (and so `p.brand`) has not caught up yet.
  const [pending, setPending] = useState<{ brand?: number } | null>(null);
  const brandPending = pending !== null && pending.brand !== p.brand;
  // The selected brand can only be shown once the brand list is in.
  const brandsLoading = brandPending || !brands.data;
  const modelsLoading = (brandPending && !!pending.brand) || (!!p.brand && models.loading);
  const hasFilters =
    p.brand || p.model || p.body.length || p.yearFrom || p.yearTo || p.importFrom || p.importTo || p.priceMin || p.priceMax || p.fuel.length || p.steering;

  return (
    <section className="space-y-4 rounded-2xl bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{t("Шүүлтүүр")}</h2>
        {hasFilters ? (
          <button
            className="text-[13px] font-semibold text-primary"
            onClick={() =>
              set({
                brand: undefined,
                model: undefined,
                body: [],
                yearFrom: undefined,
                yearTo: undefined,
                importFrom: undefined,
                importTo: undefined,
                priceMin: undefined,
                priceMax: undefined,
                fuel: [],
                steering: undefined,
              })
            }
          >
            {t("Цэвэрлэх")}
          </button>
        ) : null}
      </div>

      <Group title={t("Үйлдвэр, загвар")}>
        <div className="space-y-2.5">
          <div className="relative">
            <Select
              value={brandsLoading ? "" : (p.brand ?? "")}
              onChange={(e) => {
                const brand = num(e.target.value);
                setPending({ brand });
                set({ brand, model: undefined });
              }}
              disabled={brandsLoading}
              aria-busy={brandsLoading}
              aria-label={t("Үйлдвэр")}
            >
              <option value="">{brandsLoading ? t("Ачаалж байна...") : t("Бүх үйлдвэр")}</option>
              {!brandsLoading &&
                brands.data?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </Select>
            {brandsLoading && <SelectSpinner />}
          </div>
          <div className="relative">
            <Select
              value={modelsLoading ? "" : (p.model ?? "")}
              onChange={(e) => set({ model: num(e.target.value) })}
              disabled={!p.brand || modelsLoading}
              aria-busy={modelsLoading}
              aria-label={t("Загвар")}
            >
              <option value="">{modelsLoading ? t("Ачаалж байна...") : t("Бүх загвар")}</option>
              {!modelsLoading &&
                models.data?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </Select>
            {modelsLoading && <SelectSpinner />}
          </div>
        </div>
      </Group>

      <Group title={t("Төрөл")}>
        {/* Toggle tiles, any number at once; the check marks what is on. */}
        {bodyTypes.length ? (
          <div className="grid grid-cols-2 gap-2">
            {bodyTypes.map((b) => {
              const on = p.body.includes(b.id);
              const image = catalogImage(b.image, "bodyTypes");
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ body: on ? p.body.filter((x) => x !== b.id) : [...p.body, b.id] })}
                  className={cn(
                    "relative flex flex-col items-center gap-1.5 rounded-xl border-2 bg-muted px-2 pb-2.5 pt-3 text-[13px] font-semibold transition-colors",
                    on ? "border-primary bg-primary-soft" : "border-transparent hover:border-border"
                  )}
                >
                  {on && (
                    <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-white">
                      <Check className="size-3" strokeWidth={3.2} />
                    </span>
                  )}
                  {image ? (
                    <Img src={image} loading="lazy" className="h-8 w-full rounded-md object-contain" />
                  ) : (
                    <CarArt shape={shapeFor(b.name)} className="h-8 w-auto" strokeWidth={2.6} />
                  )}
                  <span className="w-full truncate text-center">{bodyTypeLabel(b.name, t)}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <Spinner className="mx-auto size-5" />
        )}
      </Group>

      <Group title={t("Үнэ (сая ₮)")}>
        <RangeSelect options={PRICES} from={p.priceMin} to={p.priceMax} onChange={(priceMin, priceMax) => set({ priceMin, priceMax })} />
      </Group>

      <Group title={t("Үйлдвэрлэсэн он")}>
        <RangeSelect options={YEARS} from={p.yearFrom} to={p.yearTo} onChange={(yearFrom, yearTo) => set({ yearFrom, yearTo })} />
      </Group>

      <Group title={t("Орж ирсэн он")}>
        <RangeSelect options={YEARS} from={p.importFrom} to={p.importTo} onChange={(importFrom, importTo) => set({ importFrom, importTo })} />
      </Group>

      <Group title={t("Түлш")}>
        <div className="space-y-3">
          {FUEL_TYPES.map((f) => {
            const on = p.fuel.includes(f);
            return (
              <label key={f} className="flex cursor-pointer items-center gap-3 text-[15px]">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={on}
                  onChange={() => set({ fuel: on ? p.fuel.filter((x) => x !== f) : [...p.fuel, f] })}
                />
                <span className={cn("grid size-5 place-items-center rounded-[5px] border-[1.5px]", on ? "border-primary bg-primary text-white" : "border-input bg-white")}>
                  {on && <Check className="size-3.5" strokeWidth={3.2} />}
                </span>
                {tv(f)}
              </label>
            );
          })}
        </div>
      </Group>

      <Group title={t("Хүрд")}>
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
          {[undefined, ...STEERINGS].map((s) => (
            <button
              key={s ?? "all"}
              onClick={() => set({ steering: s })}
              className={cn("rounded-lg py-2 text-sm font-semibold", p.steering === s ? "bg-white shadow-sm" : "text-foreground/70")}
            >
              {s ? tv(s) : t("Бүгд")}
            </button>
          ))}
        </div>
      </Group>
    </section>
  );
}

/**
 * Phone-size filters: a full-screen sheet over a draft copy of the params.
 * "Search" applies the draft; the back arrow drops it.
 */
function MobileFilters({
  p,
  brands,
  bodyTypes,
  onApply,
  onClose,
}: {
  p: Params;
  brands: Loaded<Brand[]>;
  bodyTypes: BodyType[];
  onApply: (next: Params) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(p);
  const models = useApi(() => (draft.brand ? getModels(draft.brand) : Promise.resolve([])), String(draft.brand ?? ""));

  // The page behind must not scroll while the sheet is up.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-label={t("Шүүлтүүр")} className="fixed inset-0 z-[60] flex flex-col bg-muted lg:hidden">
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-white px-2 pt-[env(safe-area-inset-top)]">
        <button type="button" onClick={onClose} aria-label={t("Буцах")} className="grid size-10 place-items-center rounded-xl hover:bg-muted">
          <ArrowLeft className="size-5" />
        </button>
        <button type="button" onClick={() => onApply(draft)} className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover">
          {t("Хайх")}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <Filters
          key={writeParams(draft)}
          p={draft}
          set={(patch) => setDraft((d) => ({ ...d, ...patch }))}
          brands={brands}
          models={models}
          bodyTypes={bodyTypes}
        />
      </div>
    </div>
  );
}

function CarsPageInner() {
  const router = useRouter();
  const { t } = useI18n();
  const pathname = usePathname();
  const sp = useSearchParams();
  const p = useMemo(() => readParams(new URLSearchParams(sp.toString())), [sp]);
  const [showFilters, setShowFilters] = useState(false);

  const set = (patch: Partial<Params>) => {
    const next = { ...p, page: 1, ...patch };
    const qs = writeParams(next);
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: "page" in patch });
  };

  const brands = useApi(getBrands);
  const models = useApi(() => (p.brand ? getModels(p.brand) : Promise.resolve([])), String(p.brand ?? ""));
  const bodyTypes = useApi(getBodyTypes);
  const dealers = useApi(getDealers);
  const key = writeParams(p);
  const result = useApi(
    () =>
      searchCars({
        brandIds: p.brand ? [p.brand] : undefined,
        modelId: p.model,
        bodyTypeIds: p.body,
        locationId: p.location,
        yearFrom: p.yearFrom,
        yearTo: p.yearTo,
        importedFrom: p.importFrom,
        importedTo: p.importTo,
        priceMin: p.priceMin && p.priceMin * MLN,
        priceMax: p.priceMax && p.priceMax * MLN,
        fuelTypes: p.fuel,
        steering: p.steering,
        sort: p.sort,
        page: p.page,
        pageSize: PAGE_SIZE,
      }),
    key
  );

  const rows = result.data?.rows ?? [];
  const totalPages = Math.ceil((result.data?.count ?? 0) / PAGE_SIZE);
  // The design lifts one featured ad into a wide card after the first row.
  const wide = rows.find((c) => c.is_featured);
  const rest = rows.filter((c) => c !== wide);

  return (
    <>
      {/* Title band over a road photo (Unsplash, see public/hero/CREDITS.md), darkened so the white text reads. */}
      <section className="relative isolate overflow-hidden bg-dark text-white">
        <div className="absolute inset-0 -z-10">
          <Img
            src="/hero/road.webp"
            srcSet="/hero/road-sm.webp 900w, /hero/road.webp 1920w"
            sizes="100vw"
            alt=""
            fetchPriority="high"
            className="size-full object-cover object-[center_60%]"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        <Container className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-10 md:py-16">
          <h1 className="font-display text-3xl font-bold uppercase leading-tight tracking-tight md:text-5xl">{t("Машин хайх")}</h1>
          {/* Total beside the title; pulses while results are loading. */}
          <span aria-live="polite" className={cn("text-sm font-medium tabular-nums text-white/75 md:text-base", result.loading && "animate-pulse")}>
            {result.data ? t("{n} машин", { n: result.data.count.toLocaleString("en-US") }) : "…"}
          </span>
        </Container>
      </section>

      <Container className="pt-1 md:pt-3">
        {(dealers.loading && !dealers.data) || dealers.data?.rows.length ? (
          <>
            <p className="mt-6 text-xs font-semibold text-muted-foreground">{t("Дилерүүд")}</p>
            <DealerTabs className="mt-2" items={dealers.data?.rows ?? []} loading={dealers.loading && !dealers.data} />
          </>
        ) : null}

        <p className="mt-4 text-xs font-semibold text-muted-foreground">{t("Үйлдвэр")}</p>
        <BrandTabs
          className="mt-2"
          items={brands.data ?? []}
          loading={brands.loading && !brands.data}
          selectedId={p.brand}
          onSelect={(id) => set({ brand: id, model: undefined })}
        />

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[296px_1fr]">
          <aside>
            <button
              onClick={() => setShowFilters(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-card py-3 text-sm font-bold lg:hidden"
              aria-haspopup="dialog"
            >
              <SlidersHorizontal className="size-4" />
              {t("Шүүлтүүр")}
            </button>
            <div className="hidden lg:block">
              <Filters key={key} p={p} set={set} brands={brands} models={models} bodyTypes={bodyTypes.data ?? []} />
            </div>
            {showFilters && (
              <MobileFilters
                p={p}
                brands={brands}
                bodyTypes={bodyTypes.data ?? []}
                onClose={() => setShowFilters(false)}
                onApply={(next) => {
                  setShowFilters(false);
                  set({ ...next, page: 1 });
                }}
              />
            )}
          </aside>

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{result.data ? t("{n} зар олдлоо", { n: result.data.count }) : " "}</p>
              <Select value={p.sort} onChange={(e) => set({ sort: e.target.value as Params["sort"] })} className="h-10 w-48 text-sm" aria-label={t("Эрэмбэлэх")}>
                {CAR_SORTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {t(o.label)}
                  </option>
                ))}
              </Select>
            </div>

            {result.loading && !result.data ? (
              <CardGridSkeleton />
            ) : result.error ? (
              <ErrorState message={result.error.message} onRetry={result.reload} />
            ) : rows.length === 0 ? (
              <EmptyState title={t("Тохирох зар олдсонгүй")} description={t("Шүүлтүүрээ өөрчлөөд дахин оролдоно уу.")} />
            ) : (
              <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", result.loading && "opacity-60")}>
                {rest.slice(0, 3).map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
                {wide && <CarWideCard car={wide} />}
                {rest.slice(3).map((car) => (
                  <CarCard key={car.id} car={car} />
                ))}
              </div>
            )}

            <div className="mt-8">
              <Pagination page={p.page} total={totalPages} onChange={(page) => set({ page })} />
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CarsPageInner />
    </Suspense>
  );
}

