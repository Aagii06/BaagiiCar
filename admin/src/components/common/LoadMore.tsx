"use client";

import { useEffect, useRef } from "react";
import { Spinner } from "./States";
import { tr } from "@/lib/i18n/translations";

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
    <div ref={ref} role="status" aria-label={tr("Ачаалж байна")} className="flex justify-center py-4">
      <Spinner className="size-5" />
    </div>
  );
}
