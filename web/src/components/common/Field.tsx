"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Check, ChevronDown, Search } from "lucide-react";
import { Children, isValidElement, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export const inputClass =
  "h-12 w-full rounded-xl border border-input bg-white px-4 text-[15px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-muted";

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-destructive">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  /** Sheet heading on phones; defaults to `aria-label`. */
  title?: string;
};

/**
 * Native `<select>` on desktop. Below `md` a transparent button covers it and picking happens in a
 * bottom sheet (as in the admin) instead of the phone's own picker; `onChange(e)` still gets `e.target.value`.
 */
export function Select({ className, children, title, ...props }: SelectProps) {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const current = String(props.value ?? "");
  const pick = (next: string) => {
    setOpen(false);
    if (next === current) return;
    props.onChange?.({ target: { value: next, name: props.name }, currentTarget: { value: next, name: props.name } } as unknown as React.ChangeEvent<HTMLSelectElement>);
  };
  return (
    <span className="relative block">
      <select {...props} className={cn(inputClass, "appearance-none pr-10", className)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <button
        type="button"
        disabled={props.disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={props["aria-label"] ?? title}
        onClick={() => setOpen(true)}
        className="absolute inset-0 md:hidden"
      />
      {open && (
        <OptionSheet title={title ?? props["aria-label"] ?? t("Сонгох")} options={readOptions(children)} value={current} onPick={pick} onClose={() => setOpen(false)} />
      )}
    </span>
  );
}

const SEARCH_FROM = 12;

export type OptionItem = { value: string; label: React.ReactNode; text: string };

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

/** Bottom sheet of options, sized to them but never higher than 25% from the top. */
export function OptionSheet({ title, options, value, onPick, onClose }: { title: string; options: OptionItem[]; value: string; onPick: (v: string) => void; onClose: () => void }) {
  const { t } = useI18n();
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

  // Portal: outside a surrounding <label>, so taps in the sheet don't re-trigger the field.
  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 flex max-h-[75dvh] animate-sheet-up flex-col rounded-t-3xl bg-white shadow-2xl"
      >
        <div className="shrink-0 px-5 pt-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
          <h2 id={titleId} className="truncate text-lg font-bold">
            {title}
          </h2>
          {searchable && (
            <label className="relative mt-3 block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Хайх")} className={cn(inputClass, "pl-10")} />
            </label>
          )}
        </div>
        <div ref={listRef} role="listbox" aria-labelledby={titleId} className="mt-2 min-h-0 flex-1 divide-y divide-border overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
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
                    "flex w-full items-center gap-3 px-5 py-4 text-left text-base hover:bg-muted/60",
                    active && "font-bold text-primary",
                    !o.value && !active && "text-muted-foreground"
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  {active && <Check className="size-4 shrink-0" strokeWidth={3} />}
                </button>
              );
            })
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("Олдсонгүй")}</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

const PHONE_MASK = "________";

/** 8-digit phone field (same as the admin login): digits only, with an underscore mask after the caret while focused. */
export function PhoneInput({
  value,
  onChange,
  className,
  maskClassName,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type"> & {
  value: string;
  onChange: (digits: string) => void;
  /** Mask position / font when `className` changes the input's padding or text size. */
  maskClassName?: string;
}) {
  const [focused, setFocused] = useState(false);
  const shown = value.replace(/\D/g, "").slice(0, PHONE_MASK.length);
  return (
    <span className="relative block">
      <input
        {...props}
        type="tel"
        inputMode="numeric"
        maxLength={PHONE_MASK.length}
        value={shown}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, PHONE_MASK.length))}
        onFocus={(e) => (setFocused(true), props.onFocus?.(e))}
        onBlur={(e) => (setFocused(false), props.onBlur?.(e))}
        className={cn(inputClass, "focus:placeholder:text-transparent", className)}
      />
      {focused && (
        // Typed part is invisible so the remaining underscores line up right after the caret.
        <span aria-hidden className={cn("pointer-events-none absolute inset-y-0 left-[17px] flex items-center whitespace-pre text-[15px] text-muted-foreground/70", maskClassName)}>
          <span className="invisible">{shown}</span>
          {PHONE_MASK.slice(shown.length)}
        </span>
      )}
    </span>
  );
}
