"use client";

import { useEffect, useRef } from "react";

/** Infinite-scroll sentinel: calls `onMore` when it comes near the viewport. Re-key it after each page so a still-visible sentinel fires again. */
export default function LoadMore({ onMore }: { onMore: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMoreRef = useRef(onMore);
  useEffect(() => {
    onMoreRef.current = onMore;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && onMoreRef.current(), { rootMargin: "300px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="py-4 text-center text-xs font-semibold text-muted-foreground">
      Ачаалж байна…
    </div>
  );
}
