"use client";

import { Select } from "@/components/common/Field";
import { Spinner } from "@/components/common/States";
import { getBrands, getModels, searchCars } from "@/lib/api/cars";
import { dealerName, getDealers } from "@/lib/api/dealers";
import { COMPARE_MAX, useCompare } from "@/lib/compare/CompareProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatNumber, formatPriceShort } from "@/lib/utils";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { carTitle } from "./CarCard";
import CarImage from "./CarImage";

const PAGE = 20;
const MLN = 1_000_000;

/** Price bands in million ₮; 0 = open end. */
const PRICES = [
  { min: 0, max: 30 },
  { min: 30, max: 60 },
  { min: 60, max: 100 },
  { min: 100, max: 0 },
];

const num = (v: string) => (v ? Number(v) : undefined);

interface Filters {
  brand?: number;
  model?: number;
  dealer?: number;
  /** Index into PRICES. */
  price?: number;
}

/** Modal list of active ads to pick from on the compare page; stays open until the list is full. */
export default function ComparePicker({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { ids, full, toggle } = useCompare();
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const [take, setTake] = useState(PAGE);
  const [f, setF] = useState<Filters>({});
  const brands = useApi(getBrands);
  const models = useApi(() => (f.brand ? getModels(f.brand) : Promise.resolve([])), String(f.brand ?? ""));
  const dealers = useApi(getDealers);
  const filter = (next: Filters) => {
    setF((prev) => ({ ...prev, ...next }));
    setTake(PAGE);
  };
  const filtered = !!(f.brand || f.model || f.dealer || f.price != null);

  // Debounce typing; a new search starts from the first page again.
  useEffect(() => {
    const id = setTimeout(() => {
      setText(query.trim());
      setTake(PAGE);
    }, 300);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  useEffect(() => {
    if (full) onClose();
  }, [full, onClose]);

  const band = f.price != null ? PRICES[f.price] : undefined;
  const cars = useApi(
    () =>
      searchCars({
        text,
        brandIds: f.brand ? [f.brand] : undefined,
        modelId: f.model,
        dealerId: f.dealer,
        priceMin: band?.min ? band.min * MLN : undefined,
        priceMax: band?.max ? band.max * MLN : undefined,
        pageSize: take,
      }),
    `${text}|${f.brand}|${f.model}|${f.dealer}|${f.price}|${take}`
  );
  const list = cars.data?.rows ?? [];
  const more = (cars.data?.count ?? 0) > list.length;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-picker-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border p-4">
          <h2 id="compare-picker-title" className="text-lg font-bold">
            {t("Машин нэмэх")}
          </h2>
          <span className="text-sm text-muted-foreground">
            {ids.length} / {COMPARE_MAX}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Хаах")}
            className="ml-auto grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-4 pb-2">
          <label className="flex h-11 items-center gap-2 rounded-xl border border-input px-3.5 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Үйлдвэр, загвараар хайх")}
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/80"
            />
          </label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Select value={f.brand ?? ""} onChange={(e) => filter({ brand: num(e.target.value), model: undefined })} aria-label={t("Үйлдвэр")} className="h-10 px-3 text-sm">
              <option value="">{t("Бүх үйлдвэр")}</option>
              {brands.data?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
            <Select
              value={f.model ?? ""}
              onChange={(e) => filter({ model: num(e.target.value) })}
              disabled={!f.brand}
              aria-label={t("Загвар")}
              className="h-10 px-3 text-sm disabled:opacity-60"
            >
              <option value="">{t("Бүх загвар")}</option>
              {models.data?.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
            <Select value={f.dealer ?? ""} onChange={(e) => filter({ dealer: num(e.target.value) })} aria-label={t("Дилер")} className="h-10 px-3 text-sm">
              <option value="">{t("Бүх дилер")}</option>
              {dealers.data?.rows.map((d) => (
                <option key={d.id} value={d.id}>
                  {dealerName(d)}
                </option>
              ))}
            </Select>
            <Select value={f.price ?? ""} onChange={(e) => filter({ price: num(e.target.value) })} aria-label={t("Үнэ")} className="h-10 px-3 text-sm">
              <option value="">{t("Бүх үнэ")}</option>
              {PRICES.map((p, i) => (
                <option key={i} value={i}>
                  {!p.min ? t("{n} сая хүртэл", { n: p.max }) : !p.max ? t("{n} сая +", { n: p.min }) : t("{a} – {b} сая", { a: p.min, b: p.max })}
                </option>
              ))}
            </Select>
          </div>
          {filtered && (
            <button type="button" onClick={() => filter({ brand: undefined, model: undefined, dealer: undefined, price: undefined })} className="mt-2 text-xs font-semibold text-muted-foreground hover:text-destructive">
              {t("Цэвэрлэх")}
            </button>
          )}
        </div>

        <div className="min-h-40 flex-1 overflow-y-auto px-2 pb-3">
          {cars.loading && !cars.data ? (
            <div className="grid place-items-center py-12">
              <Spinner />
            </div>
          ) : cars.error ? (
            <p className="px-3 py-10 text-center text-sm text-destructive">{cars.error.message}</p>
          ) : !list.length ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">{t("Тохирох зар олдсонгүй")}</p>
          ) : (
            <ul>
              {list.map((c) => {
                const added = ids.includes(c.id);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => toggle(c.id)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-muted disabled:hover:bg-transparent"
                    >
                      <CarImage id={c.id} image={c.image} bodyType={c.body_type_name} size="thumb" className="h-14 w-20 shrink-0 rounded-lg" artClassName="w-12" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold">
                          {carTitle(c, t)}
                          {c.manufactured_year ? <span className="font-normal text-muted-foreground"> · {c.manufactured_year}</span> : null}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          <span className="font-bold text-primary">{formatPriceShort(c.price, t)}</span>
                          {c.mileage != null && ` · ${t("{n} км", { n: formatNumber(c.mileage) })}`}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-full",
                          added ? "bg-success-soft text-success" : "border-[1.5px] border-primary text-primary"
                        )}
                      >
                        {added ? <Check className="size-4" /> : <Plus className="size-4" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {more && (
            <button
              type="button"
              disabled={cars.loading}
              onClick={() => setTake((n) => n + PAGE)}
              aria-busy={cars.loading}
              className="mx-2 mt-2 flex h-10 w-[calc(100%-1rem)] items-center justify-center gap-2 rounded-xl bg-muted text-sm font-bold hover:bg-border disabled:cursor-wait"
            >
              {cars.loading && <Loader2 className="size-4 animate-spin text-primary" />}
              {cars.loading ? t("Ачаалж байна...") : t("Цааш үзэх")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
