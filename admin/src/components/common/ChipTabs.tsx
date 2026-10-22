import { cn } from "@/lib/utils";

/** `value` may be a list when several chips can be on at once; `onChange` still reports the tapped chip. */
export default function ChipTabs<T extends string>({ items, value, onChange }: { items: { value: T; label: string }[]; value: T | T[]; onChange: (v: T) => void }) {
  const isOn = (v: T) => (Array.isArray(value) ? value.includes(v) : v === value);
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          aria-pressed={isOn(it.value)}
          className={cn("shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold", isOn(it.value) ? "bg-dark text-white" : "bg-muted text-foreground/80 hover:bg-border")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
