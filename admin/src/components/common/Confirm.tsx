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

const TONES: Record<Tone, { icon: string; button: string }> = {
  primary: { icon: "bg-primary-soft text-primary", button: "bg-primary hover:bg-primary-hover text-white" },
  amber: { icon: "bg-amber-soft text-amber-ink", button: "bg-amber hover:brightness-95 text-foreground" },
  success: { icon: "bg-success-soft text-success", button: "bg-success hover:brightness-95 text-white" },
  danger: { icon: "bg-destructive-soft text-destructive", button: "bg-destructive hover:brightness-95 text-white" },
};

const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);

/** Bottom-sheet confirm dialog; `await confirm({...})` resolves true on confirm. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<(ConfirmOptions & { resolve: (ok: boolean) => void }) | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setOpen({ ...options, resolve })), []);

  const close = (ok: boolean) => {
    open?.resolve(ok);
    setOpen(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {open && <Sheet options={open} onClose={close} />}
    </ConfirmContext.Provider>
  );
}

function Sheet({ options, onClose }: { options: ConfirmOptions; onClose: (ok: boolean) => void }) {
  const { title, message, detail, confirmLabel = "Тийм", cancelLabel = "Болих", tone = "primary", icon: Icon = CircleAlert } = options;
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-dark/50 backdrop-blur-[2px]" onClick={() => onClose(false)} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
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
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onClose(false)} className="h-12 rounded-xl bg-muted font-bold hover:bg-border">
            {cancelLabel}
          </button>
          <button ref={confirmRef} type="button" onClick={() => onClose(true)} className={cn("h-12 rounded-xl font-bold outline-none focus-visible:ring-4 focus-visible:ring-black/10", TONES[tone].button)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used inside <ConfirmProvider>");
  return ctx;
}
