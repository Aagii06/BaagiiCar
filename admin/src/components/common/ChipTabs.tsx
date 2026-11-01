"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type ChipTab<T extends string> = {
  value: T;
  label: string;
  /** Own colours instead of the neutral ones: `on` when selected, `off` otherwise. */
  tone?: { on: string; off: string };
};

/** `value` may be a list when several chips can be on at once; `onChange` still reports the tapped chip. */
export default function ChipTabs<T extends string>({ items, value, onChange }: { items: ChipTab<T>[]; value: T | T[]; onChange: (v: T) => void }) {
  const isOn = (v: T) => (Array.isArray(value) ? value.includes(v) : v === value);
  const ref = useRef<HTMLDivElement>(null);
  // The scrollbar is hidden, so a plain mouse wheel (Windows) would have no way to reach the
  // overflowing chips: turn vertical wheel into horizontal scroll while the row can still move.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0 || (e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);
  return (
    <div ref={ref} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          aria-pressed={isOn(it.value)}
          className={cn("shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold", isOn(it.value) ? (it.tone?.on ?? "bg-dark text-white") : (it.tone?.off ?? "bg-muted text-foreground/80 hover:bg-border"))}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
