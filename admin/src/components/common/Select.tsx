"use client";

// Field.tsx re-exports this Select; the cycle is fine since both are only read at render time.
import { FieldLabelContext, inputClass } from "@/components/common/Field";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Children, isValidElement, useContext, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

const SEARCH_FROM = 12;

type OptionItem = { value: string; label: React.ReactNode; text: string };

const textOf = (node: React.ReactNode): string =>
  Children.toArray(node)
    .map((n) => (typeof n === "string" || typeof n === "number" ? String(n) : isValidElement<{ children?: React.ReactNode }>(n) ? textOf(n.props.children) : ""))
    .join("");

/** `<option>` children (conditionals and lists included) → plain items. */
function readOptions(children: React.ReactNode): OptionItem[] {
  return Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string | number; children?: React.ReactNode }>(child) || child.type !== "option") return [];
    const label = child.props.children;
    return [{ value: String(child.props.value ?? textOf(label)), label, text: textOf(label) }];
  });
}

export type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "value"> & {
  value: string | number;
  /** Sheet heading; defaults to the surrounding Field's label. */
  title?: string;
  /** Drops the standard input look (for a select embedded in another control). */
  bare?: boolean;
  chevronClassName?: string;
};

/**
 * Drop-in for `<select>`: same `value` / `onChange(e)` / `<option>` children, but picking happens in a
 * bottom sheet that fills the screen from 25% down. A hidden native select stays in the form so
 * `required` still blocks the submit and gets the red border (RequiredFieldMarker).
 */
export default function Select({ value, onChange, children, className, disabled, required, title, bare, chevronClassName, name, id, ...rest }: SelectProps) {
  const [open, setOpen] = useState(false);
  const fieldLabel = useContext(FieldLabelContext);
  const nativeRef = useRef<HTMLSelectElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const options = readOptions(children);
  const current = String(value ?? "");
  const selected = options.find((o) => o.value === current);
  const empty = !current;

  const pick = (next: string) => {
    setOpen(false);
    triggerRef.current?.focus();
    if (next === current) return;
    nativeRef.current?.removeAttribute("data-invalid");
    // Callers only read `e.target.value`.
    onChange?.({ target: { value: next, name }, currentTarget: { value: next, name } } as unknown as React.ChangeEvent<HTMLSelectElement>);
  };

  return (
    <span className="select-field relative block">
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(bare ? "h-full outline-none" : cn(inputClass, "flex items-center pr-10 text-left"), "select-trigger", empty && !bare && "text-muted-foreground", className)}
      >
        <span className="min-w-0 flex-1 truncate">{selected?.label ?? (current ? current : "Сонгох")}</span>
      </button>
      <ChevronDown className={cn("pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground", chevronClassName)} />
      {/* Keeps native form validation (required) and the invalid mark; focus is passed to the button. */}
      <select
        {...rest}
        ref={nativeRef}
        name={name}
        value={current}
        required={required}
        disabled={disabled}
        onChange={() => {}}
        onFocus={() => triggerRef.current?.focus()}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute inset-0 size-full opacity-0"
      >
        {children}
      </select>
      {open && <OptionSheet title={title ?? fieldLabel?.replace(/\s*\*$/, "") ?? "Сонгох"} options={options} value={current} onPick={pick} onClose={() => setOpen(false)} />}
    </span>
  );
}

function OptionSheet({ title, options, value, onPick, onClose }: { title: string; options: OptionItem[]; value: string; onPick: (v: string) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const titleId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const searchable = options.length >= SEARCH_FROM;
  const needle = q.trim().toLowerCase();
  const rows = needle ? options.filter((o) => o.text.toLowerCase().includes(needle)) : options;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Start with the chosen row in view.
    listRef.current?.querySelector("[aria-selected='true']")?.scrollIntoView({ block: "center" });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  // Portal: outside the field's <label>, so taps in the sheet don't re-trigger the select.
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 top-[25dvh] mx-auto flex max-w-md animate-sheet-up flex-col rounded-t-3xl bg-white shadow-2xl"
      >
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="truncate text-lg font-bold">
              {title}
            </h2>
            <button type="button" onClick={onClose} aria-label="Хаах" className="grid size-9 shrink-0 place-items-center rounded-xl hover:bg-muted">
              <X className="size-5" />
            </button>
          </div>
          {searchable && (
            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Хайх" className={cn(inputClass, "pl-10")} />
            </label>
          )}
        </div>
        <div ref={listRef} role="listbox" aria-labelledby={titleId} className="mt-2 min-h-0 flex-1 overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {rows.length ? (
            rows.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => onPick(o.value)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] hover:bg-muted",
                    active && "bg-primary-soft font-bold text-primary hover:bg-primary-soft",
                    !o.value && !active && "text-muted-foreground"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {active && <Check className="size-4 shrink-0" strokeWidth={3} />}
                </button>
              );
            })
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">Олдсонгүй</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
