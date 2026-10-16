"use client";

import { Select } from "@/components/common/Field";
import { getBrands, getModels } from "@/lib/api/cars";
import { useApi } from "@/lib/useApi";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const THIS_YEAR = new Date().getFullYear();
export const YEAR_FROM_OPTIONS = [2020, 2015, 2010, 2005, 2000];
export const PRICE_MAX_OPTIONS = [30, 60, 100, 200]; // сая ₮

const TABS = [
  { key: "all", label: "Бүх машин" },
  { key: "new", label: "Шинэвтэр" },
  { key: "budget", label: "Хямд" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 border-border px-4 pt-3 lg:border-r lg:last-of-type:border-r-0">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const cellSelect = "h-9 border-0 bg-transparent px-0 text-[15px] font-semibold focus:ring-0";

/** White search card overlapping the bottom of the full-width hero. */
export default function HeroSearch() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("all");
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const brands = useApi(getBrands);
  const models = useApi(() => (brandId ? getModels(Number(brandId)) : Promise.resolve([])), brandId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (brandId) q.set("brand", brandId);
    if (modelId) q.set("model", modelId);
    const year = yearFrom || (tab === "new" ? String(THIS_YEAR - 3) : "");
    const price = priceMax || (tab === "budget" ? "30" : "");
    if (year) q.set("yearFrom", year);
    if (price) q.set("priceMax", price);
    router.push(`/cars${q.size ? `?${q}` : ""}`);
  };

  return (
    <div>
      <div className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            aria-pressed={tab === t.key}
            className={cn(
              "rounded-t-xl px-4 py-2.5 text-xs font-bold uppercase tracking-[0.1em] transition-colors",
              tab === t.key ? "bg-white text-foreground" : "bg-dark text-white hover:bg-dark-2"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <form
        onSubmit={submit}
        className="grid overflow-hidden rounded-b-2xl rounded-tr-2xl bg-white shadow-2xl shadow-black/10 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]"
      >
        <Cell label="Үйлдвэр">
          <Select
            className={cellSelect}
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setModelId("");
            }}
          >
            <option value="">Бүгд</option>
            {brands.data?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </Cell>
        <Cell label="Загвар">
          <Select className={cellSelect} value={modelId} onChange={(e) => setModelId(e.target.value)} disabled={!brandId}>
            <option value="">Бүгд</option>
            {models.data?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Cell>
        <Cell label="Он">
          <Select className={cellSelect} value={yearFrom} onChange={(e) => setYearFrom(e.target.value)}>
            <option value="">Бүгд</option>
            {YEAR_FROM_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y} – {THIS_YEAR}
              </option>
            ))}
          </Select>
        </Cell>
        <Cell label="Үнэ">
          <Select className={cellSelect} value={priceMax} onChange={(e) => setPriceMax(e.target.value)}>
            <option value="">Хязгааргүй</option>
            {PRICE_MAX_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p} сая ₮ хүртэл
              </option>
            ))}
          </Select>
        </Cell>
        <button className="m-2 flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-10 font-display text-lg font-semibold text-white hover:bg-primary-hover sm:col-span-2 lg:col-span-1 lg:m-0 lg:h-auto lg:rounded-none">
          <Search className="size-5" strokeWidth={2.4} />
          Хайх
        </button>
      </form>
    </div>
  );
}
