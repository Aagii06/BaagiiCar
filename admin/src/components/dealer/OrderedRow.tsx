import { ChevronDown, ChevronUp, X } from "lucide-react";
import MainBadge from "./MainBadge";

const arrowClass = "grid h-5 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30";

/** One editable row in `DealerListSheet`: the input, the main badge on the first row, ↑ / ↓ and remove. */
export default function OrderedRow({
  index,
  count,
  onMove,
  onRemove,
  children,
}: {
  index: number;
  count: number;
  /** Swap with the neighbour above (-1) or below (1). */
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">{children}</div>
      {index === 0 && <MainBadge />}
      <div className="flex shrink-0 flex-col">
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Дээш зөөх" className={arrowClass}>
          <ChevronUp className="size-4" />
        </button>
        <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Доош зөөх" className={arrowClass}>
          <ChevronDown className="size-4" />
        </button>
      </div>
      <button type="button" onClick={onRemove} aria-label="Хасах" className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground hover:bg-border">
        <X className="size-4" />
      </button>
    </div>
  );
}
