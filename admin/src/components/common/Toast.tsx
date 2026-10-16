"use client";

import { cn } from "@/lib/utils";
import { createContext, useCallback, useContext, useState } from "react";

type Tone = "success" | "error";
interface ToastItem {
  id: number;
  message: string;
  tone: Tone;
}

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const show = useCallback((message: string, tone: Tone = "success") => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-50 mx-auto flex max-w-md flex-col items-center gap-2 px-4" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={cn("rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-lg", t.tone === "error" ? "bg-destructive" : "bg-dark")}>
            {t.message}
          </div>
        ))}
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
