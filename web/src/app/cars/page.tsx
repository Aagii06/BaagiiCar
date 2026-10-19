"use client";

import BodyTypeTabs from "@/components/car/BodyTypeTabs";
import BrandTabs from "@/components/car/BrandTabs";
import CarCard from "@/components/car/CarCard";
import CarWideCard from "@/components/car/CarWideCard";
import Container, { PageTitle } from "@/components/common/Container";
import { Select } from "@/components/common/Field";
import Pagination from "@/components/common/Pagination";
import { CardGridSkeleton, EmptyState, ErrorState, LoadingState } from "@/components/common/States";
import { CAR_SORTS, getBodyTypes, getBrands, getModels, searchCars, type CarSort } from "@/lib/api/cars";
import type { Brand } from "@/lib/api/types";
import { FUEL_TYPES, PAGE_SIZE, STEERINGS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const MLN = 1_000_000;

type Params = {
  brands: number[];
  model?: number;
  body?: number;
  yearFrom?: number;
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
    brands: list(sp.get("brand")).map(Number).filter(Boolean),
    model: num(sp.get("model")),
    body: num(sp.get("body")),
    yearFrom: num(sp.get("yearFrom")),
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
  if (p.brands.length) q.set("brand", p.brands.join(","));
  if (p.model) q.set("model", String(p.model));
  if (p.body) q.set("body", String(p.body));
  if (p.yearFrom) q.set("yearFrom", String(p.yearFrom));
  if (p.priceMin) q.set("priceMin", String(p.priceMin));
  if (p.priceMax) q.set("priceMax", String(p.priceMax));
  if (p.fuel.length) q.set("fuel", p.fuel.join(","));
  if (p.steering) q.set("steering", p.steering);
  if (p.sort !== "new") q.set("sort", p.sort);
  if (p.page > 1) q.set("page", String(p.page));
  return q.toString();
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function BrandChip({ brand, modelNames, onRemove }: { brand: Brand; modelNames: string; onRemove: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-3 rounded-xl border-[1.5px] border-foreground px-3 py-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-bold">{brand.name[0]}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{brand.name}</p>
        {modelNames && <p className="truncate text-xs text-muted-foreground">{modelNames}</p>}
      </div>
      <button onClick={onRemove} aria-label={t("{name} хасах", { name: brand.name })} className="grid size-6 shrink-0 place-items-center rounded-full bg-dark text-white">
        <X className="size-3.5" strokeWidth={3} />
      </button>
    </div>
  );
}

function Filters({ p, set }: { p: Params; set: (patch: Partial<Params>) => void }) {
  const { t, tv } = useI18n();
  const brands = useApi(getBrands);
  const singleBrand = p.brands.length === 1 ? p.brands[0] : undefined;
  const models = useApi(() => (singleBrand ? getModels(singleBrand) : Promise.resolve([])), String(singleBrand ?? ""));
  const allModels = useApi(() => getModels());
  const [priceMin, setPriceMin] = useState(p.priceMin ? String(p.priceMin) : "");
  const [priceMax, setPriceMax] = useState(p.priceMax ? String(p.priceMax) : "");

  const selected = (brands.data ?? []).filter((b) => p.brands.includes(b.id));
  const available = (brands.data ?? []).filter((b) => !p.brands.includes(b.id));
  const hasFilters = p.brands.length || p.model || p.yearFrom || p.priceMin || p.priceMax || p.fuel.length || p.steering;

  return (
    <div className="space-y-4">
      <Panel
        title={t("Үйлдвэр, загвар")}
        action={
          hasFilters ? (
            <button
              className="text-[13px] font-semibold text-primary"
              onClick={() => {
                setPriceMin("");
                setPriceMax("");
                set({ brands: [], model: undefined, yearFrom: undefined, priceMin: undefined, priceMax: undefined, fuel: [], steering: undefined });
              }}
            >
              {t("Цэвэрлэх")}
            </button>
          ) : null
        }
      >
        <div className="space-y-2.5">
          {selected.map((b) => (
            <BrandChip
              key={b.id}
              brand={b}
              modelNames={(allModels.data ?? [])
                .filter((m) => m.brand_id === b.id)
                .slice(0, 3)
                .map((m) => m.name)
                .join(", ")}
              onRemove={() => set({ brands: p.brands.filter((id) => id !== b.id), model: undefined })}
            />
          ))}
          {brands.loading && !brands.data ? (
            <LoadingState className="py-4" />
          ) : (
            <Select
              value=""
              onChange={(e) => e.target.value && set({ brands: [...p.brands, Number(e.target.value)], model: undefined })}
              className="border-0 bg-primary font-bold text-white [&>option]:text-foreground"
              aria-label={t("Үйлдвэр сонгох")}
            >
              <option value="">{t("Үйлдвэр сонгох")}</option>
              {available.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          )}
          {singleBrand && (models.data?.length ?? 0) > 0 && (
            <Select value={p.model ?? ""} onChange={(e) => set({ model: num(e.target.value) })} aria-label={t("Загвар")}>
              <option value="">{t("Бүх загвар")}</option>
              {models.data!.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </Panel>

      <Panel title={t("Үнэ")}>
        <form
          className="grid grid-cols-2 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            set({ priceMin: num(priceMin), priceMax: num(priceMax) });
          }}
        >
          <label className="rounded-xl bg-muted px-3 py-2">
            <span className="block text-[11px] font-medium text-muted-foreground">{t("Доод (сая ₮)")}</span>
            <input inputMode="numeric" value={priceMin} onChange={(e) => setPriceMin(e.target.value.replace(/\D/g, ""))} onBlur={() => set({ priceMin: num(priceMin) })} placeholder="0" className="w-full bg-transparent text-sm font-bold outline-none" />
          </label>
          <label className="rounded-xl bg-muted px-3 py-2">
            <span className="block text-[11px] font-medium text-muted-foreground">{t("Дээд (сая ₮)")}</span>
            <input inputMode="numeric" value={priceMax} onChange={(e) => setPriceMax(e.target.value.replace(/\D/g, ""))} onBlur={() => set({ priceMax: num(priceMax) })} placeholder="∞" className="w-full bg-transparent text-sm font-bold outline-none" />
          </label>
          <button type="submit" hidden />
        </form>
      </Panel>

      <Panel title={t("Он")}>
        <Select value={p.yearFrom ?? ""} onChange={(e) => set({ yearFrom: num(e.target.value) })} aria-label={t("Үйлдвэрлэсэн он")}>
          <option value="">{t("Бүгд")}</option>
          {[2022, 2020, 2018, 2015, 2012, 2010, 2005, 2000].map((y) => (
            <option key={y} value={y}>
              {t("{y} оноос хойш", { y })}
            </option>
          ))}
        </Select>
      </Panel>

      <Panel title={t("Түлш")}>
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
      </Panel>

      <Panel title={t("Хүрд")}>
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
      </Panel>
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
  const bodyTypes = useApi(getBodyTypes);
  const key = writeParams(p);
  const result = useApi(
    () =>
      searchCars({
        brandIds: p.brands,
        modelId: p.model,
        bodyTypeId: p.body,
        yearFrom: p.yearFrom,
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
    <Container className="pt-8 md:pt-12">
      <PageTitle count={result.data?.count}>{t("Машин авах")}</PageTitle>

      <p className="mt-6 text-xs font-semibold text-muted-foreground">{t("Үйлдвэр")}</p>
      <BrandTabs
        className="mt-2"
        items={brands.data ?? []}
        selectedIds={p.brands}
        onToggle={(id) => set({ brands: p.brands.includes(id) ? p.brands.filter((b) => b !== id) : [...p.brands, id], model: undefined })}
      />

      <p className="mt-4 text-xs font-semibold text-muted-foreground">{t("Төрөл")}</p>
      <BodyTypeTabs className="mt-2" items={bodyTypes.data ?? []} selectedId={p.body} onSelect={(id) => set({ body: id })} />

      <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[296px_1fr]">
        <aside>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-card py-3 text-sm font-bold lg:hidden"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="size-4" />
            {t("Шүүлтүүр")}
          </button>
          <div className={cn("mt-3 lg:mt-0 lg:block", showFilters ? "block" : "hidden")}>
            <Filters key={key} p={p} set={set} />
          </div>
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
                <CarCard key={car.id} car={car} showDescription />
              ))}
              {wide && <CarWideCard car={wide} />}
              {rest.slice(3).map((car) => (
                <CarCard key={car.id} car={car} showDescription />
              ))}
            </div>
          )}

          <div className="mt-8">
            <Pagination page={p.page} total={totalPages} onChange={(page) => set({ page })} />
          </div>
        </div>
      </div>
    </Container>
  );
}

export default function CarsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CarsPageInner />
    </Suspense>
  );
}

