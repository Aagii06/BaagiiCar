"use client";

import { COMPARE_MAX, useCompare } from "@/lib/compare/CompareProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { GitCompare } from "lucide-react";

/** Icon toggle that adds the car to / removes it from the compare list. */
export default function CompareButton({ carId, className }: { carId: number; className?: string }) {
  const { isCompared, full, toggle } = useCompare();
  const { t } = useI18n();
  const on = isCompared(carId);
  const blocked = full && !on;
  const label = on ? t("Харьцуулалтаас хасах") : blocked ? t("Хамгийн ихдээ {n} машин", { n: COMPARE_MAX }) : t("Харьцуулалтад нэмэх");
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={on}
      disabled={blocked}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(carId);
      }}
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl border-[1.5px] transition disabled:cursor-not-allowed disabled:opacity-40",
        on ? "border-dark bg-dark text-white" : "border-border text-foreground/70 hover:border-foreground hover:text-foreground",
        className
      )}
    >
      <GitCompare className="size-4" />
    </button>
  );
}
