"use client";

import { Select } from "@/components/common/Field";
import { getBrands, getModels } from "@/lib/api/cars";
import { useApi } from "@/lib/useApi";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const THIS_YEAR = new Date().getFullYear();
export const YEAR_FROM_OPTIONS = [2020, 2015, 2010, 2005, 2000];
export const PRICE_MAX_OPTIONS = [30, 60, 100, 200]; // сая ₮

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 rounded-xl bg-muted px-3 pt-2">
      <span className="block text-[11px] font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

const cellSelect = "h-9 border-0 bg-transparent px-0 text-sm font-semibold focus:ring-0";

/** The white search strip that overlaps the bottom of the hero. */
export default function HeroSearch() {
  const router = useRouter();
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
    if (yearFrom) q.set("yearFrom", yearFrom);
    if (priceMax) q.set("priceMax", priceMax);
    router.push(`/cars${q.size ? `?${q}` : ""}`);
  };

  return (
    <form onSubmit={submit} className="grid gap-2 rounded-2xl bg-white p-2.5 shadow-xl shadow-black/5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_auto]">
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
      <button className="flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-12 font-bold text-white hover:bg-primary-hover sm:col-span-2 lg:col-span-1 lg:h-auto">
        <Search className="size-4" strokeWidth={2.6} />
        Хайх
      </button>
    </form>
  );
}
