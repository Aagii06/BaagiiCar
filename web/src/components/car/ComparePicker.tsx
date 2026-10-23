"use client";

import { Spinner } from "@/components/common/States";
import { searchCars } from "@/lib/api/cars";
import { COMPARE_MAX, useCompare } from "@/lib/compare/CompareProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatNumber, formatPriceShort } from "@/lib/utils";
import { Check, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { carTitle } from "./CarCard";
import CarImage from "./CarImage";

const PAGE = 20;

/** Modal list of active ads to pick from on the compare page; stays open until the list is full. */
export default function ComparePicker({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { ids, full, toggle } = useCompare();
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");
  const [take, setTake] = useState(PAGE);

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

  const cars = useApi(() => searchCars({ text, pageSize: take }), `${text}|${take}`);
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
              className="mx-2 mt-2 h-10 w-[calc(100%-1rem)] rounded-xl bg-muted text-sm font-bold hover:bg-border disabled:opacity-60"
            >
              {t("Цааш үзэх")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
