"use client";

import { cn } from "@/lib/utils";
import { CircleAlert, type LucideIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { tr } from "@/lib/i18n/translations";

type Tone = "primary" | "amber" | "success" | "danger";

export interface ConfirmOptions {
  title: string;
  message?: React.ReactNode;
  /** Extra block under the message, e.g. the ad being changed. */
  detail?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  icon?: LucideIcon;
}

export interface PromptOptions extends ConfirmOptions {
  label?: string;
  placeholder?: string;
  /**
   * A one-line money field instead of the textarea: digits only, shown as "50,000" with a ₮ suffix while typing;
   * resolves the plain number ("50000"). `"signed"` also allows a leading "-" (for deductions).
   */
  money?: boolean | "signed";
}

/** Keeps digits (and a leading "-" when signed) and groups thousands: "-50000" → "-50,000". */
function maskMoney(raw: string, signed: boolean) {
  const negative = signed && raw.trim().startsWith("-");
  const digits = raw
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, 12);
  return (negative ? "-" : "") + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

const TONES: Record<Tone, { icon: string; button: string }> = {
  primary: {
    icon: "bg-primary-soft text-primary",
    button: "bg-primary hover:bg-primary-hover text-white",
  },
  amber: {
    icon: "bg-amber-soft text-amber-ink",
    button: "bg-amber hover:brightness-95 text-foreground",
  },
  success: {
    icon: "bg-success-soft text-success",
    button: "bg-success hover:brightness-95 text-white",
  },
  danger: {
    icon: "bg-destructive-soft text-destructive",
    button: "bg-destructive hover:brightness-95 text-white",
  },
};

type Open =
  | (PromptOptions & {
      input: boolean;
      resolve: (value: string | null) => void;
      /** New per dialog: keys the sheet so a prompt opened right after another starts empty and focused. */
      id: number;
    })
  | null;

const ConfirmContext = createContext<{
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
} | null>(null);

/**
 * Bottom-sheet dialogs: `await confirm({...})` resolves true on confirm;
 * `await prompt({...})` asks for required text and resolves it (null on cancel).
 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<Open>(null);
  const nextId = useRef(0);

  const prompt = useCallback(
    (options: PromptOptions) =>
      new Promise<string | null>((resolve) =>
        setOpen({ ...options, input: true, resolve, id: ++nextId.current }),
      ),
    [],
  );
  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) =>
        setOpen({
          ...options,
          input: false,
          resolve: (v) => resolve(v !== null),
          id: ++nextId.current,
        }),
      ),
    [],
  );

  const close = useCallback((value: string | null) => {
    setOpen((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={{ confirm, prompt }}>
      {children}
      {open && <Sheet key={open.id} options={open} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

function Sheet({
  options,
  onClose,
}: {
  options: NonNullable<Open>;
  onClose: (value: string | null) => void;
}) {
  const {
    title,
    message,
    detail,
    confirmLabel = tr("Тийм"),
    cancelLabel = tr("Болих"),
    tone = "primary",
    icon: Icon = CircleAlert,
    input,
    label,
    placeholder,
    money,
  } = options;
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement & HTMLInputElement>(null);
  const [text, setText] = useState("");
  // A money field sends the bare number; it needs at least one digit.
  const value = money ? text.replace(/,/g, "") : text.trim();
  const canConfirm = !input || (money ? /\d/.test(value) : value.length > 0);

  useEffect(() => {
    (input ? inputRef.current : confirmRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input, onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]"
        onClick={() => onClose(null)}
      />
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onSubmit={(e) => {
          e.preventDefault();
          if (canConfirm) onClose(input ? value : "");
        }}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-md animate-sheet-up rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="flex flex-col items-center text-center">
          <span
            className={cn(
              "grid size-14 place-items-center rounded-full",
              TONES[tone].icon,
            )}
          >
            <Icon className="size-7" />
          </span>
          <h2 id="confirm-title" className="mt-3 text-lg font-bold">
            {title}
          </h2>
          {message && (
            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          )}
        </div>
        {detail && <div className="mt-4">{detail}</div>}
        {input && (
          <label className="mt-4 block">
            {label && (
              <span className="mb-1.5 block text-[13px] font-semibold">
                {label}
              </span>
            )}
            {money ? (
              <div className="flex h-14 items-center rounded-xl border border-input bg-white px-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10">
                <input
                  ref={inputRef}
                  type="text"
                  inputMode={money === "signed" ? "text" : "numeric"}
                  autoComplete="off"
                  value={text}
                  onChange={(e) =>
                    setText(maskMoney(e.target.value, money === "signed"))
                  }
                  placeholder={placeholder}
                  className="min-w-0 flex-1 bg-transparent text-right font-display text-xl font-bold tabular-nums outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-muted-foreground/70"
                />
                <span className="ml-1.5 text-xl font-bold text-muted-foreground">
                  ₮
                </span>
              </div>
            ) : (
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full resize-none rounded-xl border border-input bg-white px-4 py-3 text-base outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            )}
          </label>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onClose(null)}
            className="h-12 rounded-xl bg-muted font-bold hover:bg-border"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="submit"
            disabled={!canConfirm}
            className={cn(
              "h-12 rounded-xl font-bold outline-none focus-visible:ring-4 focus-visible:ring-black/10 disabled:opacity-50",
              TONES[tone].button,
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

function useDialogs() {
  const ctx = useContext(ConfirmContext);
  if (!ctx)
    throw new Error(
      "useConfirm/usePrompt must be used inside <ConfirmProvider>",
    );
  return ctx;
}

export const useConfirm = () => useDialogs().confirm;
export const usePrompt = () => useDialogs().prompt;
