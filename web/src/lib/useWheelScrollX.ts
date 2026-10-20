"use client";

import { useEffect, useRef } from "react";

/**
 * Lets a plain mouse wheel scroll a horizontal row (trackpads already can).
 * Only takes over while the row can still move that way, so the page scrolls
 * normally once the row hits either end.
 */
export function useWheelScrollX<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;
      if ((e.deltaY < 0 && el.scrollLeft <= 0) || (e.deltaY > 0 && el.scrollLeft >= max - 1)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    // Non-passive so preventDefault can stop the page from scrolling too.
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return ref;
}
