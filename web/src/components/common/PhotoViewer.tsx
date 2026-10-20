"use client";

import Img from "./Img";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Fullscreen photo slider. Swipe (native scroll-snap), ‹ › buttons or ←/→ keys
 * move between photos; ✕ / Esc closes.
 */
export default function PhotoViewer({ urls, start, onClose }: { urls: string[]; start: number; onClose: () => void }) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);

  const go = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el || i < 0 || i >= urls.length) return;
      el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    },
    [urls.length]
  );

  // Open on the tapped photo without animating there.
  useLayoutEffect(() => {
    const el = track.current;
    if (el) el.scrollLeft = start * el.clientWidth;
  }, [start]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, onClose]);

  // Keep the page behind from scrolling while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const arrow = "absolute top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 disabled:invisible sm:grid";

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={t("Зураг")} className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] text-white">
        <span className="text-sm font-semibold tabular-nums">
          {index + 1} / {urls.length}
        </span>
        <button type="button" onClick={onClose} aria-label={t("Хаах")} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
          <X className="size-6" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={track}
          onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
        >
          {urls.map((url) => (
            <div key={url} className="flex h-full w-full shrink-0 snap-center items-center justify-center p-2">
              <Img
                src={url}
                className="max-h-full max-w-full select-none object-contain"
                skeletonClassName="bg-white/10"
                placeholderClassName="aspect-[4/3] w-full"
                draggable={false}
              />
            </div>
          ))}
        </div>
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label={t("Өмнөх зураг")} className={cn(arrow, "left-3")}>
          <ChevronLeft className="size-6" />
        </button>
        <button type="button" onClick={() => go(index + 1)} disabled={index === urls.length - 1} aria-label={t("Дараах зураг")} className={cn(arrow, "right-3")}>
          <ChevronRight className="size-6" />
        </button>
      </div>

      {urls.length > 1 && (
        <div className="flex justify-center gap-1.5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
          {urls.map((url, i) => (
            <button key={url} type="button" onClick={() => go(i)} aria-label={t("Зураг {n}", { n: i + 1 })} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-white" : "w-1.5 bg-white/40")} />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}
