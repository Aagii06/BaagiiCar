"use client";

import { LogoMark } from "@/components/layout/Logo";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { Bot, X } from "lucide-react";
import { useState } from "react";

/**
 * Floating AI assistant in the bottom corner on every page. Questions about an
 * ad go through CarChatDialog instead; the AI itself is not connected yet.
 */
export default function ChatWidget() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    // Sits above the mobile tab bar; bottom corner from md up.
    <div className="fixed bottom-[calc(5.25rem+env(safe-area-inset-bottom))] right-4 z-50 flex flex-col items-end gap-3 md:bottom-6 md:right-6">
      {open && (
        <section
          role="dialog"
          aria-label={t("AI туслах")}
          className="flex h-[min(480px,calc(100dvh-9rem))] w-[calc(100vw-2rem)] max-w-[370px] flex-col overflow-hidden rounded-2xl bg-background shadow-2xl shadow-black/25"
        >
          <header className="relative shrink-0 bg-primary px-5 pb-5 pt-4 text-center text-white">
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
            <button onClick={() => setOpen(false)} aria-label={t("Хаах")} className="absolute right-3 top-3 grid size-7 place-items-center rounded-full hover:bg-white/15">
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
