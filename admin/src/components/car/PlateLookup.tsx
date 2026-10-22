"use client";

import Select from "@/components/common/Select";

import { vehicleLookup, type VehicleInfo } from "@/lib/api/cars";
import { cn } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";

type SearchType = "plate" | "vin";

const TYPES: Record<SearchType, { label: string; short: string; placeholder: string; check: RegExp; error: string }> = {
  plate: { label: "Улсын дугаар", short: "Улсын", placeholder: "1234 УБА", check: /^\d{4}[А-ЯЁӨҮ]{3}$/, error: "Улсын дугаарын формат буруу байна (жш: 1234 УБА)" },
  vin: { label: "Арлын дугаар", short: "Арлын", placeholder: "NHP106487692", check: /^[A-HJ-NPR-Z0-9-]{6,17}$/, error: "Арлын дугаарын формат буруу байна" },
};

/** "1698 уао" → "1698УАО" */
const normalize = (v: string) => v.replace(/\s+/g, "").toUpperCase();

/**
 * Search the vehicle registry (autobox.mn via the backend) by plate or chassis number;
 * the result is handed to the form to fill itself.
 */
export default function PlateLookup({ onFound }: { onFound: (info: VehicleInfo) => string | null }) {
  const [type, setType] = useState<SearchType>("plate");
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const t = TYPES[type];

  const search = async () => {
    const q = normalize(value);
    if (!q || busy) return;
    if (!t.check.test(q)) return setNote({ tone: "error", text: t.error });
    setBusy(true);
    setNote(null);
    try {
      const info = await vehicleLookup({ [type]: q });
      setNote({ tone: "ok", text: onFound(info) ?? "Мэдээлэл бөглөгдлөө" });
    } catch (err) {
      setNote({ tone: "error", text: err instanceof Error ? err.message : "Машины мэдээлэл олдсонгүй" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl bg-card p-4">
      <h2 className="text-lg font-bold">Машины мэдээлэл хайх</h2>
      <p className="mb-3 text-xs text-muted-foreground">Бүртгэлээс үйлдвэр, загвар, он, хөдөлгүүр, гүйлт зэргийг автоматаар бөглөнө</p>
      {/* Not a <form>: this sits inside the car form, Enter must search instead of submitting it. */}
      <div className="flex h-12 overflow-hidden rounded-xl border border-input bg-white transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
        <span className="relative shrink-0 border-r border-input bg-primary-soft">
          <Select
            bare
            title="Хайх төрөл"
            value={type}
            onChange={(e) => {
              setType(e.target.value as SearchType);
              setNote(null);
            }}
            aria-label="Хайх төрөл"
            className="cursor-pointer bg-transparent pl-3 pr-7 text-[13px] font-semibold text-primary"
            chevronClassName="right-2 size-3.5 text-primary"
          >
            {(Object.keys(TYPES) as SearchType[]).map((k) => (
              <option key={k} value={k}>
                {TYPES[k].short}
              </option>
            ))}
          </Select>
        </span>
        <input
          className="min-w-0 flex-1 bg-transparent px-3 text-[15px] font-semibold uppercase tracking-wide outline-none placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/70"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder={`${t.label}: ${t.placeholder}`}
          maxLength={20}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={search}
          disabled={busy || !value.trim()}
          aria-label="Хайх"
          className="grid w-14 shrink-0 place-items-center bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <Search className="size-5" />}
        </button>
      </div>
      {note && <p className={cn("mt-2 text-xs font-semibold", note.tone === "ok" ? "text-success" : "text-destructive")}>{note.text}</p>}
    </section>
  );
}
