"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

function pages(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, total, onChange }: { page: number; total: number; onChange: (page: number) => void }) {
  const { t } = useI18n();
  if (total <= 1) return null;
  return (
    <nav aria-label={t("Хуудас")} className="flex justify-center gap-2">
      {pages(page, total).map((p, i) =>
        p === "…" ? (
          <span key={`gap${i}`} className="grid size-10 place-items-center rounded-xl bg-card text-sm font-bold">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn("grid size-10 place-items-center rounded-xl text-sm font-bold", p === page ? "bg-dark text-white" : "bg-card hover:bg-border")}
          >
            {p}
          </button>
        )
      )}
    </nav>
  );
}
