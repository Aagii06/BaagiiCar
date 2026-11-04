import { Plus } from "lucide-react";

/** Dashed "+ …" button that appends an empty row in `DealerListSheet`. */
export default function AddRowButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border py-3 text-sm font-bold text-primary hover:bg-muted/60 disabled:pointer-events-none disabled:opacity-40"
    >
      <Plus className="size-4" strokeWidth={2.6} />
      {label}
    </button>
  );
}
