"use client";

import { inputClass } from "@/components/common/Field";
import { vehicleLookup, type VehicleInfo } from "@/lib/api/cars";
import { cn } from "@/lib/utils";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";

const PLATE = /^\d{4}[А-ЯЁӨҮ]{3}$/;

/** "1698уао" / "1698 УАО" → "1698УАО"; anything else is left to the server's validation. */
const normalize = (v: string) => v.replace(/\s+/g, "").toUpperCase();

/**
 * Search the vehicle registry (autobox.mn via the backend) by plate number, or by chassis
 * number when the input isn't a plate; the result is handed to the form to fill itself.
 */
export default function PlateLookup({ onFound }: { onFound: (info: VehicleInfo) => string | null }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const search = async () => {
    const q = normalize(value);
    if (!q || busy) return;
    setBusy(true);
    setNote(null);
    try {
      const info = await vehicleLookup(PLATE.test(q) ? { plate: q } : { vin: q });
      const summary = onFound(info);
      setNote({ tone: "ok", text: summary ?? "Мэдээлэл бөглөгдлөө" });
    } catch (err) {
      setNote({ tone: "error", text: err instanceof Error ? err.message : "Машины мэдээлэл олдсонгүй" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl bg-card p-4">
      <h2 className="text-lg font-bold">Улсын дугаараар хайх</h2>
      <p className="mb-3 text-xs text-muted-foreground">Бүртгэлээс үйлдвэр, загвар, он, хөдөлгүүр, гүйлт зэргийг автоматаар бөглөнө</p>
      {/* Not a <form>: this sits inside the car form, Enter must search instead of submitting it. */}
      <div className="flex gap-2">
        <input
          className={cn(inputClass, "min-w-0 flex-1 font-semibold uppercase tracking-wide")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
          placeholder="1234 УБА эсвэл арлын дугаар"
          maxLength={20}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={search}
          disabled={busy || !value.trim()}
          className="flex h-12 shrink-0 items-center gap-1.5 rounded-xl bg-dark px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Хайх
        </button>
      </div>
      {note && <p className={cn("mt-2 text-xs font-semibold", note.tone === "ok" ? "text-success" : "text-destructive")}>{note.text}</p>}
    </section>
  );
}
