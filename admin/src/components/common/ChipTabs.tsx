import { cn } from "@/lib/utils";

export default function ChipTabs<T extends string>({ items, value, onChange }: { items: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          aria-pressed={it.value === value}
          className={cn("shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold", it.value === value ? "bg-dark text-white" : "bg-muted text-foreground/80 hover:bg-border")}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
