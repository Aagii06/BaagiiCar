"use client";

import { inputClass } from "@/components/common/Field";
import Select from "@/components/common/Select";
import { getAreas } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import type { Location } from "@/lib/api/types";
import { useEffect, useRef, useState } from "react";

/** Between the parts of a saved address: "Улаанбаатар, Баянзүрх, 1-р хороо, 5-р байр 12 тоот". */
const SEP = ", ";

interface Picked {
  aimagId: number | null;
  soumId: number | null;
  bagId: number | null;
  detail: string;
  soums: Location[];
  bags: Location[];
}

const EMPTY: Picked = { aimagId: null, soumId: null, bagId: null, detail: "", soums: [], bags: [] };

/** Reads a saved address back into the selects; one typed in before the picker lands in the detail field whole. */
async function parse(value: string, aimags: Location[]): Promise<Picked> {
  const parts = value.split(SEP);
  const aimag = aimags.find((a) => a.name === parts[0]);
  if (!aimag) return { ...EMPTY, detail: value };
  const soums = await getAreas(aimag.id);
  const soum = soums.find((s) => s.name === parts[1]);
  if (!soum) return { ...EMPTY, aimagId: aimag.id, soums, detail: parts.slice(1).join(SEP) };
  const bags = await getAreas(soum.id);
  const bag = bags.find((b) => b.name === parts[2]);
  return { aimagId: aimag.id, soumId: soum.id, bagId: bag?.id ?? null, detail: parts.slice(bag ? 3 : 2).join(SEP), soums, bags };
}

const nameOf = (list: Location[], id: number | null) => list.find((a) => a.id === id)?.name;

/**
 * An address picked from the locations tree — Аймаг/Нийслэл → Сум/Дүүрэг → Баг/Хороо — with the rest typed in
 * under it. `value` is the address as one line; `onChange` gets `""` until every part is filled.
 */
export default function AddressPicker({ value, onChange, index }: { value: string; onChange: (value: string) => void; index: number }) {
  const [aimags, setAimags] = useState<Location[]>([]);
  const [picked, setPicked] = useState<Picked>(EMPTY);
  // What this picker last sent up: a different `value` was set from outside (rows reordered or removed).
  const sent = useRef("");
  // The sheet passes a new function each render; only a changed address is sent.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  const { aimagId, soumId, bagId, detail, soums, bags } = picked;
  const aimag = nameOf(aimags, aimagId);
  const soum = nameOf(soums, soumId);
  const bag = nameOf(bags, bagId);
  // A soum without bags is complete without one.
  const complete = Boolean(aimag && soum && (bag || bags.length === 0) && detail.trim());
  const line = complete ? [aimag, soum, bag, detail.trim()].filter(Boolean).join(SEP) : "";
  const partial = !complete && Boolean(aimagId || detail.trim());

  useEffect(() => {
    getAreas(null).then(setAimags, () => setAimags([]));
  }, []);

  useEffect(() => {
    if (line === sent.current) return;
    sent.current = line;
    onChangeRef.current(line);
  }, [line]);

  useEffect(() => {
    if (value === sent.current) return;
    sent.current = value;
    let live = true;
    (value ? getAreas(null).then((all) => parse(value, all)) : Promise.resolve(EMPTY)).then(
      (next) => live && setPicked(next),
      () => live && setPicked({ ...EMPTY, detail: value })
    );
    return () => {
      live = false;
    };
  }, [value]);

  async function pickAimag(id: number | null) {
    setPicked({ ...EMPTY, aimagId: id, detail });
    if (id) {
      const list = await getAreas(id).catch(() => []);
      setPicked((p) => (p.aimagId === id ? { ...p, soums: list } : p));
    }
  }

  async function pickSoum(id: number | null) {
    setPicked((p) => ({ ...p, soumId: id, bagId: null, bags: [] }));
    if (id) {
      const list = await getAreas(id).catch(() => []);
      setPicked((p) => (p.soumId === id ? { ...p, bags: list } : p));
    }
  }

  const idOf = (v: string) => (v ? Number(v) : null);

  return (
    <div role="group" aria-label={`Хаяг ${index + 1}`} className="space-y-2">
      <Select title="Аймаг / Нийслэл" value={aimagId ?? ""} onChange={(e) => pickAimag(idOf(e.target.value))} valueLabel={aimag ?? "Аймаг / Нийслэл"}>
        <option value="">Аймаг / Нийслэл</option>
        {aimags.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </Select>
      <Select title="Сум / Дүүрэг" value={soumId ?? ""} disabled={!aimagId} onChange={(e) => pickSoum(idOf(e.target.value))} valueLabel={soum ?? "Сум / Дүүрэг"}>
        <option value="">Сум / Дүүрэг</option>
        {soums.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select
        title="Баг / Хороо"
        value={bagId ?? ""}
        disabled={!soumId || bags.length === 0}
        onChange={(e) => setPicked((p) => ({ ...p, bagId: idOf(e.target.value) }))}
        valueLabel={bag ?? "Баг / Хороо"}
      >
        <option value="">Баг / Хороо</option>
        {bags.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </Select>
      <textarea
        rows={3}
        className={cn(inputClass, "h-auto resize-none py-3")}
        aria-label={`Дэлгэрэнгүй хаяг ${index + 1}`}
        value={detail}
        onChange={(e) => setPicked((p) => ({ ...p, detail: e.target.value }))}
        maxLength={200}
        placeholder="Дэлгэрэнгүй хаяг (байр, орц, тоот…)"
      />
      {/* Until it's complete the row saves as empty, i.e. is dropped. */}
      {partial && <p className="px-1 text-xs text-muted-foreground">Аймаг, сум/дүүрэг, баг/хороо сонгож, дэлгэрэнгүй хаягаа бичнэ үү</p>}
    </div>
  );
}
