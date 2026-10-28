"use client";

import { carTitle } from "@/components/car/CarCard";
import CarImage from "@/components/car/CarImage";
import ComparePicker from "@/components/car/ComparePicker";
import Container from "@/components/common/Container";
import PageBanner from "@/components/common/PageBanner";
import { ErrorState, LoadingState } from "@/components/common/States";
import { getCarsByIds } from "@/lib/api/cars";
import type { Car } from "@/lib/api/types";
import { COMPARE_MAX, useCompare } from "@/lib/compare/CompareProvider";
import { bodyTypeLabel } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useApi } from "@/lib/useApi";
import { cn, formatEngine, formatNumber, formatPrice, toNumber } from "@/lib/utils";
import { Plus, Trophy, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";

/** Which end of a numeric row counts as better; the best cell is green, the worst red. */
type Best = "min" | "max";

interface Row {
  label: string;
  value: (c: Car) => string | number | null | undefined;
  num?: (c: Car) => number | null;
  best?: Best;
}

function rank(cars: Car[], row: Row) {
  const none = { best: new Set<number>(), worst: new Set<number>() };
  if (!row.best || !row.num || cars.length < 2) return none;
  const nums = cars.map((c) => row.num!(c));
  const valid = nums.filter((n): n is number => n != null && n > 0);
  if (valid.length < 2) return none;
  const lo = Math.min(...valid);
  const hi = Math.max(...valid);
  // Everyone equal — nothing stands out.
  if (lo === hi) return none;
  const [good, bad] = row.best === "min" ? [lo, hi] : [hi, lo];
  const at = (target: number) => new Set(nums.flatMap((n, i) => (n === target ? [i] : [])));
  return { best: at(good), worst: at(bad) };
}

export default function ComparePage() {
  const { ids, ready, remove, clear } = useCompare();
  const { t, tv } = useI18n();
  const [diffOnly, setDiffOnly] = useState(false);
  const [picking, setPicking] = useState(false);
  const closePicker = useCallback(() => setPicking(false), []);

  const key = ready ? [...ids].sort((a, b) => a - b).join(",") : "";
  const cars = useApi(() => (ready && ids.length ? getCarsByIds(ids) : Promise.resolve([])), key);
  // Keep the order cars were added in.
  const byId = new Map((cars.data ?? []).map((c) => [c.id, c]));
  const rows = ids.map((id) => byId.get(id)).filter((c): c is Car => !!c);
  const loading = !ready || (cars.loading && !cars.data);

  const specs: Row[] = [
    { label: t("Үнэ"), value: (c) => formatPrice(c.price, t), num: (c) => toNumber(c.price) || null, best: "min" },
    { label: t("Үйлдвэрлэсэн он"), value: (c) => c.manufactured_year, num: (c) => c.manufactured_year, best: "max" },
    { label: t("Орж ирсэн он"), value: (c) => c.imported_year, num: (c) => c.imported_year, best: "max" },
    { label: t("Гүйлт"), value: (c) => (c.mileage != null ? t("{n} км", { n: formatNumber(c.mileage) }) : null), num: (c) => c.mileage, best: "min" },
    { label: t("Хөдөлгүүр"), value: (c) => (c.engine_capacity ? formatEngine(c.engine_capacity, t) : null) },
    { label: t("Түлш"), value: (c) => tv(c.fuel_type) },
    { label: t("Хурдны хайрцаг"), value: (c) => tv(c.transmission) },
    { label: t("Хүрд"), value: (c) => tv(c.steering) },
    { label: t("Хөтлөгч"), value: (c) => c.drive_type },
    { label: t("Төрөл"), value: (c) => bodyTypeLabel(c.body_type_name, t) },
    { label: t("Зориулалт"), value: (c) => c.vehicle_type },
    { label: t("Гадна өнгө"), value: (c) => c.color },
    { label: t("Дотор өнгө"), value: (c) => c.interior_color },
    { label: t("Лизинг"), value: (c) => t(Number(c.is_leasing) ? "Боломжтой" : "Боломжгүй") },
    { label: t("Байршил"), value: (c) => c.location_name },
  ];
  // Only meaningful with 2+ cars (the toggle is hidden otherwise); left on after "clear" it would hide every row.
  const diff = diffOnly && rows.length > 1;
  const visible = diff ? specs.filter((r) => new Set(rows.map((c) => String(r.value(c) ?? ""))).size > 1) : specs;
  // One "add" slot while there is room — also shown on an empty page.
  const slots = rows.length < COMPARE_MAX ? 1 : 0;
  // Label column + one per car and slot. Capped widths so a lone car or "add" slot doesn't stretch
  // across the page; the min width keeps phones scrolling sideways instead of squashing.
  const cols = rows.length + slots;
  const grid = { gridTemplateColumns: `minmax(110px,180px) repeat(${cols}, minmax(170px, 240px))` };

  return (
    <>
      <PageBanner title={t("Харьцуулалт")} image="car-lot" imagePosition="object-center" aside={loading ? "…" : t("{n} машин", { n: rows.length })} asideLoading={loading} />
      <Container className="pt-4 md:pt-8">
        <div className="flex flex-wrap items-end justify-end gap-4">
          {rows.length > 1 && (
            // Phones: its own full-width row under the title, "Цэвэрлэх" on the right.
            <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-start">
              <label className="flex cursor-pointer select-none items-center gap-3 text-sm font-semibold">
                <input type="checkbox" role="switch" className="peer sr-only" checked={diffOnly} onChange={(e) => setDiffOnly(e.target.checked)} />
                <span className="relative h-7 w-12 shrink-0 rounded-full border border-border bg-card transition-colors after:absolute after:left-1 after:top-1/2 after:size-5 after:-translate-y-1/2 after:rounded-full after:bg-muted-foreground/30 after:transition-all peer-checked:border-primary peer-checked:bg-primary peer-checked:after:left-6 peer-checked:after:bg-white peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40" />
                {t("Зөвхөн ялгааг харуулах")}
              </label>
              <button
                type="button"
                onClick={() => {
                  // Back to the page as on first visit.
                  clear();
                  setDiffOnly(false);
                }}
                className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-muted px-3 text-sm font-semibold text-muted-foreground transition hover:bg-destructive-soft hover:text-destructive"
              >
                <X className="size-3.5" />
                {t("Цэвэрлэх")}
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 md:mt-8">
          {loading ? (
            <LoadingState />
          ) : cars.error ? (
            <ErrorState message={cars.error.message} onRetry={cars.reload} />
          ) : (
            <>
              {!rows.length && (
                <p className="mb-4 text-sm text-muted-foreground">{t("Машины карт дээрх харьцуулах товчийг дарж {n} хүртэл машин нэмнэ үү.", { n: COMPARE_MAX })}</p>
              )}
              <div className="no-scrollbar -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
                <div className="min-w-max overflow-hidden rounded-2xl bg-card">
                  {/* Car headers */}
                  <div className="grid gap-3 p-3" style={grid}>
                    <div />
                    {rows.map((c) => (
                      <div key={c.id} className="relative flex flex-col">
                        <Link href={`/cars/${c.id}`} className="block">
                          <CarImage id={c.id} image={c.image} bodyType={c.body_type_name} className="aspect-[4/3]" alt={carTitle(c, t)} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => remove(c.id)}
                          title={t("Харьцуулалтаас хасах")}
                          aria-label={t("Харьцуулалтаас хасах")}
                          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white shadow-sm hover:text-destructive"
                        >
                          <X className="size-4" />
                        </button>
                        <Link href={`/cars/${c.id}`} className="mt-3 px-1 font-bold leading-snug hover:text-primary">
                          {carTitle(c, t)}
                          {c.manufactured_year ? <span className="font-medium text-muted-foreground"> · {c.manufactured_year}</span> : null}
                        </Link>
                        <p className="mt-1 px-1 font-display text-lg font-bold text-primary">{formatPrice(c.price, t)}</p>
                      </div>
                    ))}
                    {Array.from({ length: slots }, (_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPicking(true)}
                        className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground transition hover:border-primary hover:text-primary"
                      >
                        <Plus className="size-6" />
                        {t("Машин нэмэх")}
                      </button>
                    ))}
                  </div>

                  {/* Spec rows */}
                  {visible.map((r, ri) => {
                    const { best, worst } = rank(rows, r);
                    return (
                      <div key={r.label} className={cn("grid items-center gap-3 px-3 py-3", ri % 2 === 0 && "bg-muted/60")} style={grid}>
                        <div className="px-1 text-xs font-medium text-muted-foreground md:text-sm">{r.label}</div>
                        {rows.map((c, i) => {
                          const v = r.value(c);
                          return (
                            <div key={c.id} className={cn("flex items-center gap-1.5 px-1 text-sm font-semibold", best.has(i) && "text-success", worst.has(i) && "text-destructive")}>
                              {v || <span className="font-normal text-muted-foreground">—</span>}
                              {best.has(i) && <Trophy className="size-3.5 shrink-0" />}
                            </div>
                          );
                        })}
                        {Array.from({ length: slots }, (_, i) => <div key={i} />)}
                      </div>
                    );
                  })}
                  {diff && !visible.length && <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("Ялгаатай үзүүлэлт алга")}</p>}
                </div>
              </div>
            </>
          )}
        </div>

        {picking && <ComparePicker onClose={closePicker} />}
      </Container>
    </>
  );
}
