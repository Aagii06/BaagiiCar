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
import { FUEL_TYPES, PAGE_SIZE, STEERINGS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { Check, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

const MLN = 1_000_000;

type Params = {
  brand?: number;
  model?: number;
  body?: number;
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
    body: num(sp.get("body")),
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
  if (p.body) q.set("body", String(p.body));
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

/** Min / max boxes; the value is applied on blur or Enter. */
function Range({
  min,
  max,
  minLabel,
  maxLabel,
  minPlaceholder,
  maxPlaceholder,
  maxLength,
  onApply,
}: {
  min?: number;
  max?: number;
  minLabel: string;
  maxLabel: string;
  minPlaceholder: string;
  maxPlaceholder: string;
  maxLength?: number;
  onApply: (min: number | undefined, max: number | undefined) => void;
}) {
  const [lo, setLo] = useState(min ? String(min) : "");
  const [hi, setHi] = useState(max ? String(max) : "");
  const apply = () => onApply(num(lo), num(hi));
  const box = (label: string, value: string, setValue: (v: string) => void, placeholder: string) => (
    <label className="rounded-xl bg-muted px-3 py-2">
      <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
      <input
        inputMode="numeric"
        maxLength={maxLength}
        value={value}
        onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
        onBlur={apply}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-bold outline-none"
      />
    </label>
  );
  return (
    <form
      className="grid grid-cols-2 gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      {box(minLabel, lo, setLo, minPlaceholder)}
      {box(maxLabel, hi, setHi, maxPlaceholder)}
      <button type="submit" hidden />
    </form>
  );
}

const THIS_YEAR = new Date().getFullYear();

function Filters({ p, set }: { p: Params; set: (patch: Partial<Params>) => void }) {
  const { t, tv } = useI18n();
  const brands = useApi(getBrands);
  const models = useApi(() => (p.brand ? getModels(p.brand) : Promise.resolve([])), String(p.brand ?? ""));
  const hasFilters =
    p.brand || p.model || p.yearFrom || p.yearTo || p.importFrom || p.importTo || p.priceMin || p.priceMax || p.fuel.length || p.steering;

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
          <Select value={p.brand ?? ""} onChange={(e) => set({ brand: num(e.target.value), model: undefined })} aria-label={t("Үйлдвэр")}>
            <option value="">{t("Бүх үйлдвэр")}</option>
            {brands.data?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select value={p.model ?? ""} onChange={(e) => set({ model: num(e.target.value) })} disabled={!p.brand} aria-label={t("Загвар")}>
            <option value="">{t("Бүх загвар")}</option>
            {models.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
      </Group>

      <Group title={t("Үнэ (сая ₮)")}>
        <Range
          min={p.priceMin}
          max={p.priceMax}
          minLabel={t("Доод")}
          maxLabel={t("Дээд")}
          minPlaceholder="0"
          maxPlaceholder="∞"
          onApply={(priceMin, priceMax) => set({ priceMin, priceMax })}
        />
      </Group>

      <Group title={t("Үйлдвэрлэсэн он")}>
        <Range
          min={p.yearFrom}
          max={p.yearTo}
          minLabel={t("Доод")}
          maxLabel={t("Дээд")}
          minPlaceholder="1990"
          maxPlaceholder={String(THIS_YEAR)}
          maxLength={4}
          onApply={(yearFrom, yearTo) => set({ yearFrom, yearTo })}
        />
      </Group>

      <Group title={t("Орж ирсэн он")}>
        <Range
          min={p.importFrom}
          max={p.importTo}
          minLabel={t("Доод")}
          maxLabel={t("Дээд")}
          minPlaceholder="1990"
          maxPlaceholder={String(THIS_YEAR)}
          maxLength={4}
          onApply={(importFrom, importTo) => set({ importFrom, importTo })}
        />
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
        brandIds: p.brand ? [p.brand] : undefined,
        modelId: p.model,
        bodyTypeId: p.body,
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
    <Container className="pt-8 md:pt-12">
      <PageTitle count={result.data?.count}>{t("Машин авах")}</PageTitle>

      <p className="mt-6 text-xs font-semibold text-muted-foreground">{t("Үйлдвэр")}</p>
      <BrandTabs
        className="mt-2"
        items={brands.data ?? []}
        selectedId={p.brand}
        onSelect={(id) => set({ brand: id, model: undefined })}
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

