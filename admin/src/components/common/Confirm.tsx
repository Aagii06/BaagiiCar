"use client";

import { cn } from "@/lib/utils";
import { CircleAlert, type LucideIcon } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

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
}

const TONES: Record<Tone, { icon: string; button: string }> = {
  primary: { icon: "bg-primary-soft text-primary", button: "bg-primary hover:bg-primary-hover text-white" },
  amber: { icon: "bg-amber-soft text-amber-ink", button: "bg-amber hover:brightness-95 text-foreground" },
  success: { icon: "bg-success-soft text-success", button: "bg-success hover:brightness-95 text-white" },
  danger: { icon: "bg-destructive-soft text-destructive", button: "bg-destructive hover:brightness-95 text-white" },
};

type Open = (PromptOptions & { input: boolean; resolve: (value: string | null) => void }) | null;

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

  const prompt = useCallback((options: PromptOptions) => new Promise<string | null>((resolve) => setOpen({ ...options, input: true, resolve })), []);
  const confirm = useCallback(
    (options: ConfirmOptions) => new Promise<boolean>((resolve) => setOpen({ ...options, input: false, resolve: (v) => resolve(v !== null) })),
    []
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
      {open && <Sheet options={open} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

function Sheet({ options, onClose }: { options: NonNullable<Open>; onClose: (value: string | null) => void }) {
  const { title, message, detail, confirmLabel = "Тийм", cancelLabel = "Болих", tone = "primary", icon: Icon = CircleAlert, input, label, placeholder } = options;
  const confirmRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const canConfirm = !input || text.trim().length > 0;

  useEffect(() => {
    (input ? inputRef.current : confirmRef.current)?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [input, onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={() => onClose(null)} />
      <form
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onSubmit={(e) => {
          e.preventDefault();
          if (canConfirm) onClose(input ? text.trim() : "");
        }}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-md animate-sheet-up rounded-t-3xl bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
        <div className="flex flex-col items-center text-center">
          <span className={cn("grid size-14 place-items-center rounded-full", TONES[tone].icon)}>
            <Icon className="size-7" />
          </span>
          <h2 id="confirm-title" className="mt-3 text-lg font-bold">
            {title}
          </h2>
          {message && <p className="mt-1 text-sm text-muted-foreground">{message}</p>}
        </div>
        {detail && <div className="mt-4">{detail}</div>}
        {input && (
          <label className="mt-4 block">
            {label && <span className="mb-1.5 block text-[13px] font-semibold">{label}</span>}
            <textarea
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-white px-4 py-3 text-[15px] outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </label>
        )}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onClose(null)} className="h-12 rounded-xl bg-muted font-bold hover:bg-border">
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="submit"
            disabled={!canConfirm}
            className={cn("h-12 rounded-xl font-bold outline-none focus-visible:ring-4 focus-visible:ring-black/10 disabled:opacity-50", TONES[tone].button)}
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
  if (!ctx) throw new Error("useConfirm/usePrompt must be used inside <ConfirmProvider>");
  return ctx;
}

export const useConfirm = () => useDialogs().confirm;
export const usePrompt = () => useDialogs().prompt;
