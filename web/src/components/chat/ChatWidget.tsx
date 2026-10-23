"use client";

import { LogoMark } from "@/components/layout/Logo";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Bot, X } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * AI assistant behind the bottom-corner button on every page: full screen on
 * phones, a floating panel from md up. Questions about an
 * ad go through CarChatDialog instead; the AI itself is not connected yet.
 */
export default function ChatWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    // Full-screen on phones: keep the page behind it from scrolling.
    const phone = window.matchMedia("(max-width: 767px)").matches;
    const overflow = document.body.style.overflow;
    if (phone) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    // Sits above the mobile tab bar; bottom corner from md up.
    <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <section
          role="dialog"
          aria-modal="true"
          aria-label={t("AI туслах")}
          className="fixed inset-0 z-[60] flex flex-col overflow-hidden bg-background md:static md:z-auto md:h-[min(480px,calc(100dvh-9rem))] md:w-[370px] md:rounded-2xl md:shadow-2xl md:shadow-black/25"
        >
          <header className="relative shrink-0 bg-primary px-5 pb-5 pt-[calc(1rem+env(safe-area-inset-top))] text-center text-white md:pt-4">
            <p className="font-bold">Cardealer</p>
            <div className="mt-3 flex justify-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-white ring-2 ring-white/60">
                <LogoMark className="size-9 rounded-full" />
              </span>
              <span className="grid size-12 place-items-center rounded-full bg-white text-primary ring-2 ring-white/60">
                <Bot className="size-6" />
              </span>
            </div>
            <p className="mt-3 font-bold">{t("AI туслах")}</p>
            <p className="mt-1 text-xs text-white/85">{t("Машин сонголт, ерөнхий асуултад хариулна")}</p>
            <button onClick={() => setOpen(false)} aria-label={t("Хаах")} className="absolute right-3 top-[calc(0.75rem+env(safe-area-inset-top))] grid size-9 place-items-center rounded-full hover:bg-white/15 md:top-3 md:size-7">
              <X className="size-4" />
            </button>
          </header>

          {/* The AI thread will live here once it is connected (messages.type = "ai"). */}
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-7" />
            </span>
            <p className="font-bold">{t("AI чат хүлээгдэж байна")}</p>
            <p className="text-sm text-muted-foreground">{t("Зарын тухай асуултаа зар дээрх чат товчоор илгээгээрэй.")}</p>
          </div>
        </section>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("Хаах") : t("AI туслах")}
        aria-expanded={open}
        className="grid size-14 place-items-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:scale-105 hover:bg-primary-hover"
      >
        {open ? <X className="size-6" /> : <Bot className="size-6" />}
      </button>
    </div>
  );
}
