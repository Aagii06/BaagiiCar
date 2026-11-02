import type { DealerListField } from "@/lib/api/admin";
import { Pencil, Plus } from "lucide-react";
import { DEALER_LISTS } from "./dealerLists";
import MainBadge from "./MainBadge";

/** One of the dealer's lists on the form: read-only rows, edited in `DealerListSheet`. */
export default function DealerListSection({ field, items, onEdit }: { field: DealerListField; items: string[]; onEdit: () => void }) {
  const cfg = DEALER_LISTS[field];
  return (
    <section className="rounded-2xl bg-card p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{cfg.title}</h2>
          <p className="text-xs text-muted-foreground">{cfg.hint}</p>
        </div>
        <button type="button" onClick={onEdit} className="flex shrink-0 items-center gap-1 rounded-xl bg-primary-soft px-3 py-2 text-sm font-bold text-primary hover:bg-primary/15">
          {items.length ? <Pencil className="size-3.5" /> : <Plus className="size-4" strokeWidth={2.6} />}
          {items.length ? "Засах" : "Нэмэх"}
        </button>
      </div>
      {items.length ? (
        <ul className="divide-y divide-border">
          {items.map((v, i) => (
            <li key={v} className="flex items-center gap-2 py-2.5">
              <span className="min-w-0 flex-1 break-words font-semibold">{v}</span>
              {i === 0 && <MainBadge />}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{cfg.empty}</p>
      )}
    </section>
  );
}
