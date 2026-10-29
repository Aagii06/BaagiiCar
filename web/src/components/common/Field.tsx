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
 * Looks like a native `<select>` (which still renders the chosen label), but a transparent button covers it
 * and picking happens in our own list: a dropdown under the field from `md` up, a bottom sheet (as in the
 * admin) below it, instead of the browser's / phone's picker. `onChange(e)` still gets `e.target.value`.
 */
export function Select({ className, children, title, ...props }: SelectProps) {
  const [open, setOpen] = useState<"sheet" | "menu" | false>(false);
  // The button the desktop dropdown hangs under (state, not a ref: it's read while rendering).
  const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
  const { t } = useI18n();
  const current = String(props.value ?? "");
  const pick = (next: string) => {
    setOpen(false);
    if (next === current) return;
    props.onChange?.({ target: { value: next, name: props.name }, currentTarget: { value: next, name: props.name } } as unknown as React.ChangeEvent<HTMLSelectElement>);
  };
  const close = () => {
    setOpen(false);
    trigger?.focus();
  };
  const show = () => setOpen(window.matchMedia("(min-width: 768px)").matches ? "menu" : "sheet");
  const heading = title ?? props["aria-label"] ?? t("Сонгох");
  return (
    <span className="group/select relative block">
      {/* Display only: the button below is the control. */}
      <select
        {...props}
        tabIndex={-1}
        aria-hidden
        data-open={open === "menu" || undefined}
        // Highlighted like a focused input while its button has keyboard focus or the dropdown is open.
        className={cn(
          inputClass,
          "pointer-events-none appearance-none pr-10 group-has-[button:focus-visible]/select:border-primary group-has-[button:focus-visible]/select:ring-4 group-has-[button:focus-visible]/select:ring-primary/10 data-[open]:border-primary data-[open]:ring-4 data-[open]:ring-primary/10",
          className
        )}
      >
        {children}
      </select>
      <ChevronDown
        className={cn("pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-transform", open === "menu" && "rotate-180 text-primary")}
      />
      <button
        ref={setTrigger}
        type="button"
        disabled={props.disabled}
        aria-haspopup="listbox"
        aria-expanded={!!open}
        aria-label={heading}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            show();
          }
        }}
        className="absolute inset-0 cursor-pointer rounded-xl outline-none disabled:cursor-default"
      />
      {open === "sheet" && <OptionSheet title={heading} options={readOptions(children)} value={current} onPick={pick} onClose={() => setOpen(false)} />}
      {open === "menu" && trigger && (
        <OptionMenu
          anchor={trigger}
          label={heading}
          options={readOptions(children)}
          value={current}
          onPick={(v) => {
            pick(v);
            trigger.focus();
          }}
          onClose={close}
        />
      )}
    </span>
  );
}

const MENU_MAX_HEIGHT = 320;
const MENU_GAP = 6;

/** Desktop dropdown under (or, near the bottom of the screen, above) the field; arrow keys + Enter pick. */
function OptionMenu({
  anchor,
  label,
  options,
  value,
  onPick,
  onClose,
}: {
  anchor: HTMLElement;
  label: string;
  options: OptionItem[];
  value: string;
  onPick: (v: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const searchable = options.length >= SEARCH_FROM;
  const needle = q.trim().toLowerCase();
  const rows = needle ? options.filter((o) => o.text.toLowerCase().includes(needle)) : options;
  const [rawActive, setActive] = useState(() => Math.max(options.findIndex((o) => o.value === value), 0));
  const active = Math.min(rawActive, rows.length - 1);

  const place = () => {
    const r = anchor.getBoundingClientRect();
    const below = window.innerHeight - r.bottom - MENU_GAP - 8;
    const up = below < Math.min(MENU_MAX_HEIGHT, 200) && r.top > below;
    return {
      left: r.left,
      width: Math.max(r.width, 220),
      ...(up ? { bottom: window.innerHeight - r.top + MENU_GAP } : { top: r.bottom + MENU_GAP }),
      maxHeight: Math.min(MENU_MAX_HEIGHT, (up ? r.top : below) - MENU_GAP - 8),
    };
  };
  const [pos, setPos] = useState(place);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!menuRef.current?.contains(target) && !anchor.contains(target)) closeRef.current();
    };
    // Follow the field when the page scrolls; the list's own scrolling doesn't move it.
    const onMove = (e: Event) => {
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      setPos(place());
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    listRef.current?.querySelector("[aria-selected='true']")?.scrollIntoView({ block: "center" });
    // Without a search box the list itself takes the arrow keys.
    if (!options.length || options.length < SEARCH_FROM) listRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
    // place() reads only the anchor's position.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchor]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index='${active}']`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive(Math.max(0, Math.min(rows.length - 1, active + (e.key === "ArrowDown" ? 1 : -1))));
    } else if (e.key === "Home" || e.key === "End") {
      if (searchable) return;
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : rows.length - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (rows[active]) onPick(rows[active].value);
    } else if (e.key === "Escape" || e.key === "Tab") {
      if (e.key === "Escape") e.preventDefault();
      onClose();
    }
  };

  // Portal: outside a surrounding <label> and any clipping parent.
  return createPortal(
    <div
      ref={menuRef}
      style={pos}
      onKeyDown={onKeyDown}
      className="fixed z-[70] flex animate-pop-in flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-xl shadow-black/10"
    >
      {searchable && (
        <label className="relative block shrink-0 border-b border-border p-2">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            placeholder={t("Хайх")}
            aria-controls={listId}
            className="h-10 w-full rounded-lg bg-muted pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/20"
          />
        </label>
      )}
      <div
        ref={listRef}
        id={listId}
        role="listbox"
        aria-label={label}
        aria-activedescendant={rows[active] ? `${listId}-${active}` : undefined}
        tabIndex={searchable ? -1 : 0}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5 outline-none"
      >
        {rows.length ? (
          rows.map((o, i) => {
            const selected = o.value === value;
            return (
              <div
                key={o.value}
                id={`${listId}-${i}`}
                data-index={i}
                role="option"
                aria-selected={selected}
                onPointerMove={() => i !== active && setActive(i)}
                onClick={() => onPick(o.value)}
                className={cn(
                  "flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  i === active && "bg-muted",
                  selected ? "font-semibold text-primary" : !o.value ? "text-muted-foreground" : "text-foreground"
                )}
              >
                <span className="min-w-0 flex-1 truncate">{o.label}</span>
                {selected && <Check className="size-4 shrink-0" strokeWidth={2.5} />}
              </div>
            );
          })
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">{t("Олдсонгүй")}</p>
        )}
      </div>
    </div>,
    document.body
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
