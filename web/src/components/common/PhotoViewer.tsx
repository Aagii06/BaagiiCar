"use client";

import Img from "./Img";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/** How far the zoom button (or a double tap) enlarges the photo. */
const ZOOM = 2.5;

/** Keeps a pan offset within ±max. */
const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

/**
 * Fullscreen photo slider. Swipe (native scroll-snap), ‹ › buttons or ←/→ keys
 * move between photos; ✕ / Esc closes. The page itself can't be zoomed on phones,
 * so the zoom button (or a double tap) enlarges the current photo; drag to look around.
 */
export default function PhotoViewer({ urls, start, onClose }: { urls: string[]; start: number; onClose: () => void }) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(start);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Pointer and pan at the start of a drag over the zoomed photo.
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const zoomed = zoom > 1;

  const resetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const go = useCallback(
    (i: number) => {
      const el = track.current;
      if (!el || i < 0 || i >= urls.length) return;
      setZoom(1);
      setPan({ x: 0, y: 0 });
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
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => (zoomed ? resetZoom() : setZoom(ZOOM))}
            aria-label={zoomed ? t("Жижигрүүлэх") : t("Томруулах")}
            className="grid size-10 place-items-center rounded-full hover:bg-white/10"
          >
            {zoomed ? <ZoomOut className="size-6" /> : <ZoomIn className="size-6" />}
          </button>
          <button type="button" onClick={onClose} aria-label={t("Хаах")} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            <X className="size-6" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={track}
          onScroll={(e) => {
            const i = Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth);
            if (i === index) return;
            setIndex(i);
            resetZoom();
          }}
          // Zoomed, a swipe pans the photo instead of moving to the next one.
          className={cn("no-scrollbar flex h-full snap-x snap-mandatory", zoomed ? "overflow-x-hidden" : "overflow-x-auto")}
        >
          {urls.map((url, i) => {
            const current = i === index;
            return (
              <div key={url} className="h-full w-full shrink-0 snap-center overflow-hidden">
                <div
                  onDoubleClick={() => (zoomed ? resetZoom() : setZoom(ZOOM))}
                  onPointerDown={(e) => {
                    if (!zoomed || !current) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    drag.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
                    setDragging(true);
                  }}
                  onPointerMove={(e) => {
                    const d = drag.current;
                    if (!d) return;
                    // The enlarged photo may move until its edge reaches the screen's.
                    const el = e.currentTarget;
                    const maxX = (el.clientWidth * (zoom - 1)) / 2;
                    const maxY = (el.clientHeight * (zoom - 1)) / 2;
                    setPan({ x: clamp(d.panX + e.clientX - d.x, maxX), y: clamp(d.panY + e.clientY - d.y, maxY) });
                  }}
                  onPointerUp={() => {
                    drag.current = null;
                    setDragging(false);
                  }}
                  onPointerCancel={() => {
                    drag.current = null;
                    setDragging(false);
                  }}
                  style={current && zoomed ? { transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` } : undefined}
                  className={cn(
                    "flex size-full items-center justify-center p-2",
                    !dragging && "transition-transform duration-200",
                    current && zoomed && "cursor-grab touch-none active:cursor-grabbing"
                  )}
                >
                  <Img
                    src={url}
                    className="max-h-full max-w-full select-none object-contain"
                    skeletonClassName="bg-white/10"
                    placeholderClassName="aspect-[4/3] w-full"
                    draggable={false}
                  />
                </div>
              </div>
            );
          })}
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
