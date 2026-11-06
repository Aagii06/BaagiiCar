import type { DealerListField } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import { Pencil, Plus, Star } from "lucide-react";
import { DEALER_LISTS } from "./dealerLists";
import MainBadge from "./MainBadge";
import { tr } from "@/lib/i18n/translations";

/**
 * One of the dealer's lists on the form: read-only rows, edited in `DealerListSheet`. The first row is the main one
 * (the first added, unless another is picked with its star); with several rows it stands out from the rest.
 */
export default function DealerListSection({
  field,
  items,
  onEdit,
  onMakeMain,
}: {
  field: DealerListField;
  items: string[];
  onEdit: () => void;
  /** Moves the row to the top, making it the main one. */
  onMakeMain: (index: number) => void;
}) {
  const cfg = DEALER_LISTS[field];
  const several = items.length > 1;
  return (
    <section className="rounded-2xl bg-card p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{cfg.title}</h2>
          <p className="text-xs text-muted-foreground">{cfg.hint}</p>
        </div>
        <button type="button" onClick={onEdit} className="flex shrink-0 items-center gap-1 rounded-xl bg-primary-soft px-3 py-2 text-sm font-bold text-primary hover:bg-primary/15">
          {items.length ? <Pencil className="size-3.5" /> : <Plus className="size-4" strokeWidth={2.6} />}
          {items.length ? tr("Засах") : tr("Нэмэх")}
        </button>
      </div>
      {items.length ? (
        <ul className="space-y-1">
          {items.map((v, i) => {
            const main = several && i === 0;
            return (
              <li key={v} className={cn("flex items-center gap-2 rounded-xl px-3 py-2.5", main ? "bg-primary-soft text-primary" : "bg-muted/50")}>
                {main && <Star className="size-4 shrink-0 fill-current" />}
                <span className={cn("min-w-0 flex-1 break-words", main ? "font-bold" : "font-medium text-foreground/80")}>{v}</span>
                {main && <MainBadge />}
                {several && i > 0 && (
                  <button
                    type="button"
                    onClick={() => onMakeMain(i)}
                    aria-label={tr("Үндсэн болгох")}
                    title={tr("Үндсэн болгох")}
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-primary-soft hover:text-primary"
                  >
                    <Star className="size-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">{cfg.empty}</p>
      )}
    </section>
  );
}
