"use client";

import { FormError } from "@/components/common/Field";
import { errorMessage } from "@/components/common/Toast";
import type { DealerListField } from "@/lib/api/admin";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import AddRowButton from "./AddRowButton";
import { DEALER_LISTS, filledOf } from "./dealerLists";
import OrderedRow from "./OrderedRow";

/**
 * Modal for one of the dealer's lists: add as many rows as needed, reorder with the arrows (the first is the main
 * one), remove, then one "Хадгалах" checks and saves them all and closes. Backdrop / Escape / "Болих" drops the changes.
 */
export default function DealerListSheet({
  field,
  items,
  onSave,
  onClose,
}: {
  field: DealerListField;
  items: string[];
  /** Resolves once saved; a thrown error stays in the sheet. */
  onSave: (items: string[]) => Promise<void>;
  onClose: () => void;
}) {
  const cfg = DEALER_LISTS[field];
  // An empty list opens with one row ready to type in.
  const [draft, setDraft] = useState(() => (items.length ? items : [""]));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const move = (i: number, dir: -1 | 1) => {
    const next = [...draft];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setDraft(next);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    // React bubbles the portal's submit up to the dealer form; keep it here.
    e.stopPropagation();
    const clean = filledOf(draft, cfg.lower);
    const problem = cfg.check(clean);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await onSave(clean);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  // Portaled out of the dealer form so Enter here saves this list, not the dealer.
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={() => !busy && onClose()} />
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dealer-list-title"
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[90dvh] max-w-md animate-sheet-up flex-col rounded-t-3xl bg-white pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 shrink-0 rounded-full bg-border" />
        <div className="px-5">
          <h2 id="dealer-list-title" className="text-lg font-bold">
            {cfg.title}
          </h2>
          <p className="text-xs text-muted-foreground">{cfg.hint}. Сумаар эрэмбэлнэ, эхнийх нь үндсэн</p>
        </div>
        <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-1">
          {draft.map((value, i) => (
            <OrderedRow key={i} index={i} count={draft.length} onMove={(dir) => move(i, dir)} onRemove={() => setDraft(draft.filter((_, j) => j !== i))}>
              {cfg.input(value, (v) => setDraft(draft.map((p, j) => (j === i ? v : p))), i)}
            </OrderedRow>
          ))}
          {(cfg.max === undefined || draft.length < cfg.max) && <AddRowButton label={cfg.addLabel} onClick={() => setDraft([...draft, ""])} />}
        </div>
        <div className="shrink-0 px-5 pt-3">
          <FormError message={error} />
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onClose} disabled={busy} className="h-12 flex-1 rounded-xl bg-muted font-bold hover:bg-border disabled:opacity-60">
              Болих
            </button>
            <button type="submit" disabled={busy} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-white hover:bg-primary-hover disabled:opacity-60">
              {busy && <Loader2 className="size-4 animate-spin" />}
              Хадгалах
            </button>
          </div>
        </div>
      </form>
    </div>,
    document.body,
  );
}
