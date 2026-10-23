"use client";

import { cn } from "@/lib/utils";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

type Tone = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

/** `aboveNav` lifts the stack clear of PanelShell's bottom nav (and its raised + button). */
export function ToastProvider({ children, aboveNav = false }: { children: React.ReactNode; aboveNav?: boolean }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (message: string, tone: Tone = "success") => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, message, tone }]);
      setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 z-40 mx-auto flex max-w-md flex-col items-stretch gap-2 px-4",
          aboveNav ? "bottom-[calc(6.5rem+env(safe-area-inset-bottom))]" : "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
        )}
        aria-live="polite"
      >
        {items.map((t) => {
          const Icon = t.tone === "error" ? CircleAlert : CircleCheck;
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto flex animate-toast-up items-center gap-2.5 rounded-xl py-2.5 pl-3.5 pr-2 text-sm font-semibold text-white",
                t.tone === "error"
                  ? "bg-linear-to-r from-[#f0646a] to-destructive shadow-md shadow-destructive/25"
                  : "bg-linear-to-r from-[#22c06a] to-success shadow-md shadow-success/25",
              )}
            >
              <Icon className="size-5 shrink-0" strokeWidth={2.4} />
              <span className="min-w-0 flex-1">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Хаах"
                className="grid size-7 shrink-0 place-items-center rounded-lg text-white/85 transition hover:bg-white/15 hover:text-white"
              >
                <X className="size-4" strokeWidth={2.6} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export const errorMessage = (err: unknown) => (err instanceof Error ? err.message : "Алдаа гарлаа");
